"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Event = {
  id: number;
  title: string;
  start_time: string;
  location: string | null;
  normalized_category: string | null;
  predicted_total: number;
};

export default function CalendarPage() {
  const { fetchApi, token } = useApi();
  const [events, setEvents] = useState<Event[]>([]);
  const [addTitle, setAddTitle] = useState("");
  const [addTime, setAddTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function load() {
    if (!token) return;
    fetchApi<{ events: Event[] }>("/events/")
      .then((d) => setEvents(d.events))
      .catch(() => {});
  }

  useEffect(load, [token, fetchApi]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetchApi("/events/add", {
        method: "POST",
        body: JSON.stringify({
          title: addTitle,
          start_time: addTime,
          location: null,
        }),
      });
      setAddTitle("");
      setAddTime("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Calendar</h1>
      <p className="text-muted-foreground">Events for the next 7 days with spending predictions</p>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add event</CardTitle>
          <CardDescription>Add an event (next 7 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Lunch with Sarah"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Start time (ISO)</Label>
              <Input
                id="time"
                type="datetime-local"
                value={addTime}
                onChange={(e) => setAddTime(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>Add event</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming events</CardTitle>
          <CardDescription>Predicted spend for each event</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground">No events in the next 7 days. Add one above.</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(ev.start_time).toLocaleString()} · {ev.normalized_category ?? "OTHER"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${ev.predicted_total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">predicted</p>
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
