"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { getTeacherProfile, saveTeacherProfile, TeacherProfile } from "@/lib/profile";
import { useToast } from "@/components/ui/toast";
import { backendApi, CURRENT_USER_QUERY_KEY, getCurrentUser, type ApiUser } from "@/lib/api";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<TeacherProfile>({ name: "", school: "", subjects: "" });
  const [saving, setSaving] = useState(false);
  const currentUser = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    retry: false,
    staleTime: Infinity
  });

  useEffect(() => {
    if (!currentUser.data?.id) return;
    const savedProfile = getTeacherProfile(currentUser.data.id);
    setProfile({
      ...savedProfile,
      name: currentUser.data.full_name || currentUser.data.name || ""
    });
  }, [currentUser.data]);

  function updateProfile(field: keyof TeacherProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      name: profile.name.trim(),
      school: profile.school.trim(),
      subjects: profile.subjects.trim()
    };
    if (!next.name) {
      toast({ title: "Name is required", description: "Please enter the name for this account." });
      return;
    }
    const currentUserId = currentUser.data?.id;
    if (!currentUserId) {
      toast({ title: "Could not save profile", description: "Please sign in again before updating your profile." });
      return;
    }

    setSaving(true);
    try {
      await backendApi.updateUser(currentUserId, { full_name: next.name });
      const savedUser = await getCurrentUser({ redirectOnUnauthorized: false });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, savedUser);

      const savedProfile = {
        ...next,
        name: savedUser.full_name || next.name
      };
      saveTeacherProfile(savedProfile, savedUser.id || currentUserId);
      setProfile(savedProfile);
      toast({ title: "Profile saved", description: "Your name is saved to your account." });
    } catch (error) {
      toast({ title: "Could not save profile", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Profile and usage settings" description="Manage profile details and usage preferences." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              <Field label="Name"><Input value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} placeholder="Teacher name" /></Field>
              <Field label="School"><Input value={profile.school} onChange={(event) => updateProfile("school", event.target.value)} placeholder="School name" /></Field>
              <Field label="Subjects taught"><Input value={profile.subjects} onChange={(event) => updateProfile("subjects", event.target.value)} placeholder="Science, Mathematics" /></Field>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
          <CardContent>
            <div className="h-3 rounded-full bg-[#ece8f6]"><div className="h-3 w-0 rounded-full bg-primary" /></div>
            <p className="mt-3 text-sm text-muted-foreground">0 generations used this month.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
