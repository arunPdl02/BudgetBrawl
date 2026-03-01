"""APScheduler auto-forfeit job: runs every 15 minutes."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database import run_query, transaction
from wallet.service import record_transaction


def _auto_forfeit_job() -> None:
    """
    1. Move 'active' challenges to 'pending_report' if event.end_time has passed.
    2. Auto-forfeit 'pending_report' challenges where report_deadline < NOW().
    """
    # Step 1: active → pending_report
    run_query(
        """
        UPDATE challenges
        SET status = 'pending_report',
            report_deadline = DATEADD('hour', 48,
                (SELECT end_time FROM calendar_events ce
                 WHERE ce.event_id = challenges.event_id
                   AND ce.user_id = challenges.initiator_id)),
            updated_at = CURRENT_TIMESTAMP()
        WHERE status = 'active'
          AND (
            SELECT end_time FROM calendar_events ce
            WHERE ce.event_id = challenges.event_id
              AND ce.user_id = challenges.initiator_id
          ) < CURRENT_TIMESTAMP()
        """,
        fetch=False,
    )

    # Step 2: auto-forfeit pending_report past deadline
    expired = run_query(
        """
        SELECT c.challenge_id, c.initiator_id, c.friend_id, c.stake_per_side
        FROM challenges c
        WHERE c.status = 'pending_report'
          AND c.report_deadline < CURRENT_TIMESTAMP()
        """
    )

    for ch in expired:
        challenge_id = ch["CHALLENGE_ID"]
        initiator_id = ch["INITIATOR_ID"]
        friend_id = ch["FRIEND_ID"]
        pot = float(ch["STAKE_PER_SIDE"]) * 2

        try:
            with transaction() as conn:
                from database import run_query_in_txn

                run_query_in_txn(
                    conn,
                    "UPDATE challenges SET status = 'auto_forfeited', "
                    "updated_at = CURRENT_TIMESTAMP() WHERE challenge_id = %s",
                    (challenge_id,),
                    fetch=False,
                )
                run_query_in_txn(
                    conn,
                    """
                    INSERT INTO challenge_outcomes
                        (challenge_id, actual_amount_spent, winner_id, loser_id,
                         pot_amount, resolution_type)
                    VALUES (%s, NULL, %s, %s, %s, 'auto_forfeited')
                    """,
                    (challenge_id, friend_id, initiator_id, pot),
                    fetch=False,
                )
                record_transaction(
                    conn,
                    user_id=friend_id,
                    txn_type="winnings",
                    amount=pot,
                    description=f"Auto-forfeit: won challenge #{challenge_id}",
                    challenge_id=challenge_id,
                )
        except Exception as exc:
            print(f"[scheduler] Failed to auto-forfeit challenge {challenge_id}: {exc}")


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(_auto_forfeit_job, "interval", minutes=15, id="auto_forfeit")
    return scheduler
