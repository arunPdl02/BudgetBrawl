"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { fetchApi, token } = useApi();
  const [events, setEvents] = useState<{ events: { id: number; title: string; predicted_total: number }[] } | null>(null);
  const [challenges, setChallenges] = useState<{ challenges: unknown[] } | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchApi<{ events: { id: number; title: string; predicted_total: number }[] }>("/events/"),
      fetchApi<{ challenges: unknown[] }>("/challenges/"),
    ])
      .then(([ev, ch]) => {
        setEvents(ev);
        setChallenges(ch);
      })
      .catch(() => {});
  }, [token, fetchApi]);

  const user = session?.user;
  const eventCount = events?.events?.length ?? 0;
  const activeChallenges = challenges?.challenges?.filter((c: { status: string }) =>
    ["pending", "active"].includes(c.status)
  ).length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name ?? "there"}!</h1>
        <p className="text-muted-foreground mt-1">Track your spending bets and stay on budget.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming events</CardTitle>
            <CardDescription>Next 7 days with predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{eventCount}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/calendar">View calendar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active bets</CardTitle>
            <CardDescription>Pending and active challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeChallenges}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/challenges">View challenges</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
            <CardDescription>Add friends to bet against</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/friends">Manage friends</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
