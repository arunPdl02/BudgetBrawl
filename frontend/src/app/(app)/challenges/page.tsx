"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Challenge = {
  id: number;
  event_title: string;
  opponent_name: string;
  opponent_email: string;
  opponent_id: number;
  threshold_amount: number;
  bet_amount: number;
  status: string;
  created_at: string;
  event_start: string;
  is_subject: boolean;
};

export default function ChallengesPage() {
  const { fetchApi, token } = useApi();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [createEventId, setCreateEventId] = useState("");
  const [createOpponentEmail, setCreateOpponentEmail] = useState("");
  const [createThreshold, setCreateThreshold] = useState("");
  const [submitChallengeId, setSubmitChallengeId] = useState<number | null>(null);
  const [submitAmount, setSubmitAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function load() {
    if (!token) return;
    fetchApi<{ challenges: Challenge[] }>("/challenges/")
      .then((d) => setChallenges(d.challenges))
      .catch(() => {});
  }

  useEffect(load, [token, fetchApi]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await fetchApi("/challenges/", {
        method: "POST",
        body: JSON.stringify({
          opponent_email: createOpponentEmail,
          event_id: parseInt(createEventId, 10),
          threshold_amount: parseFloat(createThreshold),
        }),
      });
      setSuccess("Bet created!");
      setCreateEventId("");
      setCreateOpponentEmail("");
      setCreateThreshold("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(id: number) {
    setError("");
    setLoading(true);
    try {
      await fetchApi(`/challenges/${id}/accept`, { method: "POST" });
      setSuccess("Bet accepted!");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!submitChallengeId) return;
    setError("");
    setLoading(true);
    try {
      await fetchApi(`/challenges/${submitChallengeId}/submit`, {
        method: "POST",
        body: JSON.stringify({ actual_spend: parseFloat(submitAmount) }),
      });
      setSuccess("Spend submitted!");
      setSubmitChallengeId(null);
      setSubmitAmount("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  const pending = challenges.filter((c) => c.status === "pending");
  const active = challenges.filter((c) => c.status === "active");
  const completed = challenges.filter((c) => c.status === "completed");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Challenges</h1>
      <p className="text-muted-foreground">Bet $5 that you&apos;ll spend less than your threshold</p>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      {success && (
        <div className="text-sm text-green-600 bg-green-500/10 p-3 rounded-md">{success}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create bet</CardTitle>
          <CardDescription>Bet on your own spending for an event (must have an event from calendar)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="opponent">Opponent email</Label>
              <Input
                id="opponent"
                type="email"
                placeholder="friend@example.com"
                value={createOpponentEmail}
                onChange={(e) => setCreateOpponentEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="eventId">Event ID</Label>
              <Input
                id="eventId"
                type="number"
                placeholder="Event ID from calendar"
                value={createEventId}
                onChange={(e) => setCreateEventId(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="threshold">Threshold ($)</Label>
              <Input
                id="threshold"
                type="number"
                step="0.01"
                placeholder="Your max spend target"
                value={createThreshold}
                onChange={(e) => setCreateThreshold(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>Create bet</Button>
          </form>
        </CardContent>
      </Card>

      {submitChallengeId && (
        <Card>
          <CardHeader>
            <CardTitle>Submit actual spend</CardTitle>
            <CardDescription>Subject must submit within 24h of event start</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="spend" className="sr-only">Actual spend ($)</Label>
                <Input
                  id="spend"
                  type="number"
                  step="0.01"
                  placeholder="Actual amount spent"
                  value={submitAmount}
                  onChange={(e) => setSubmitAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>Submit</Button>
              <Button type="button" variant="outline" onClick={() => setSubmitChallengeId(null)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {(pending.length > 0 || active.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Active bets</CardTitle>
            <CardDescription>Pending and active challenges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...pending, ...active].map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{c.event_title}</p>
                  <p className="text-sm text-muted-foreground">
                    vs {c.opponent_name} · threshold ${c.threshold_amount} · {c.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {c.status === "pending" && !c.is_subject && (
                    <Button size="sm" onClick={() => handleAccept(c.id)} disabled={loading}>
                      Accept
                    </Button>
                  )}
                  {c.status === "active" && c.is_subject && (
                    <Button size="sm" variant="outline" onClick={() => setSubmitChallengeId(c.id)}>
                      Submit spend
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completed.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border opacity-75">
                <div>
                  <p className="font-medium">{c.event_title}</p>
                  <p className="text-sm text-muted-foreground">vs {c.opponent_name} · {c.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
