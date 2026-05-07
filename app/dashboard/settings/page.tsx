"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { getTeacherProfile, saveTeacherProfile, TeacherProfile } from "@/lib/profile";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<TeacherProfile>({ name: "", school: "", subjects: "" });

  useEffect(() => {
    setProfile(getTeacherProfile());
  }, []);

  function updateProfile(field: keyof TeacherProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      name: profile.name.trim() || "Teacher",
      school: profile.school.trim(),
      subjects: profile.subjects.trim()
    };
    saveTeacherProfile(next);
    setProfile(next);
    toast({ title: "Profile saved", description: "Your dashboard greeting has been updated." });
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
              <Button type="submit">Save profile</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
          <CardContent>
            <div className="h-3 rounded-full bg-[#ece8f6]"><div className="h-3 w-1/3 rounded-full bg-primary" /></div>
            <p className="mt-3 text-sm text-muted-foreground">Local demo limit: 200 generations per month.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
