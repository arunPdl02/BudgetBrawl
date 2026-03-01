"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

const AVG_LUNCH = ["under_10", "10_15", "15_20", "20_25", "25_plus"];
const TRANSPORT = ["under_20", "20_40", "40_60", "60_100", "100_plus"];
const EAT_OUT = ["rarely", "weekly", "few_times_week", "daily"];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [avgLunch, setAvgLunch] = useState("");
  const [transport, setTransport] = useState("");
  const [eatOut, setEatOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = (session as { accessToken?: string })?.accessToken;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/onboarding");
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api(
        "/users/me/behavior",
        {
          method: "PUT",
          body: JSON.stringify({
            avg_lunch_band: avgLunch,
            weekly_transport_band: transport,
            eat_out_band: eatOut,
          }),
          token: token!,
        }
      );
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || !session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Quick calibration</CardTitle>
          <CardDescription>
            Help us personalize your spending predictions (no bank integration)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
            )}
            <div className="space-y-2">
              <Label>Average lunch spend ($)</Label>
              <div className="flex flex-wrap gap-2">
                {AVG_LUNCH.map((b) => (
                  <Button
                    key={b}
                    type="button"
                    variant={avgLunch === b ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAvgLunch(b)}
                  >
                    {b.replace("_", "–").replace("plus", "+")}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Weekly transport spend ($)</Label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT.map((b) => (
                  <Button
                    key={b}
                    type="button"
                    variant={transport === b ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransport(b)}
                  >
                    {b.replace("_", "–").replace("plus", "+")}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Eat-out frequency</Label>
              <div className="flex flex-wrap gap-2">
                {EAT_OUT.map((b) => (
                  <Button
                    key={b}
                    type="button"
                    variant={eatOut === b ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEatOut(b)}
                  >
                    {b.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !avgLunch || !transport || !eatOut}>
              {loading ? "Saving..." : "Done"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
