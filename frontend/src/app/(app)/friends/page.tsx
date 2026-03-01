"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Friend = { id: number; name: string; email: string; active_bet_count: number; head_to_head: string };
type Pending = { id: number; name: string; email: string };

export default function FriendsPage() {
  const { fetchApi, token } = useApi();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function load() {
    if (!token) return;
    Promise.all([
      fetchApi<Friend[]>("/friends/list"),
      fetchApi<Pending[]>("/friends/pending"),
    ])
      .then(([f, p]) => {
        setFriends(f);
        setPending(p);
      })
      .catch(() => {});
  }

  useEffect(load, [token, fetchApi]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await fetchApi("/friends/add", {
        method: "POST",
        body: JSON.stringify({ email: addEmail }),
      });
      setSuccess("Friend request sent");
      setAddEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(email: string) {
    setError("");
    setLoading(true);
    try {
      await fetchApi("/friends/accept", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess("Friend accepted");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Friends</h1>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      {success && (
        <div className="text-sm text-green-600 bg-green-500/10 p-3 rounded-md">{success}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add friend</CardTitle>
          <CardDescription>Add by email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>Add</Button>
          </form>
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending requests</CardTitle>
            <CardDescription>Accept friend requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground text-sm">{p.email}</span>
                <Button size="sm" onClick={() => handleAccept(p.email)} disabled={loading}>
                  Accept
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
          <CardDescription>Your accepted friends with head-to-head records</CardDescription>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-muted-foreground">No friends yet. Add one above!</p>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">{f.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">H2H: {f.head_to_head}</span>
                    <span className="text-sm text-muted-foreground">{f.active_bet_count} active bets</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
