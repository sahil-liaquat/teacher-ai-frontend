"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, PauseCircle, PlayCircle, Plus, Save, X } from "lucide-react";
import { backendApi, type Board, type ClassItem } from "@/lib/api";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type BoardForm = { code: string; name: string; description: string };
type ClassForm = { grade_number: string; name: string; description: string };

const emptyBoardForm: BoardForm = { code: "", name: "", description: "" };
const emptyClassForm: ClassForm = { grade_number: "", name: "", description: "" };

export default function AdminCurriculumPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const boards = useQuery({ queryKey: ["admin-curriculum-boards"], queryFn: () => backendApi.boards(0, 100) });
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const classes = useQuery({
    queryKey: ["admin-curriculum-classes", selectedBoardId],
    queryFn: () => backendApi.classesByBoard(selectedBoardId, 0, 100),
    enabled: Boolean(selectedBoardId)
  });
  const [boardForm, setBoardForm] = useState(emptyBoardForm);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [editingBoardId, setEditingBoardId] = useState("");
  const [editingBoard, setEditingBoard] = useState(emptyBoardForm);
  const [editingClassId, setEditingClassId] = useState("");
  const [editingClass, setEditingClass] = useState(emptyClassForm);

  useEffect(() => {
    const firstBoardId = boards.data?.items?.[0]?.id || "";
    if (!selectedBoardId && firstBoardId) setSelectedBoardId(firstBoardId);
  }, [boards.data?.items, selectedBoardId]);

  async function createBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await backendApi.createBoard({
      code: boardForm.code.trim().toLowerCase(),
      name: boardForm.name.trim(),
      description: cleanOptional(boardForm.description)
    });
    setBoardForm(emptyBoardForm);
    setSelectedBoardId(created.id);
    toast({ title: "Board created" });
    queryClient.invalidateQueries({ queryKey: ["admin-curriculum-boards"] });
  }

  async function saveBoard(id: string) {
    await backendApi.updateBoard(id, {
      code: editingBoard.code.trim().toLowerCase(),
      name: editingBoard.name.trim(),
      description: cleanOptional(editingBoard.description)
    });
    setEditingBoardId("");
    toast({ title: "Board updated" });
    queryClient.invalidateQueries({ queryKey: ["admin-curriculum-boards"] });
  }

  async function setBoardActive(board: Board, isActive: boolean) {
    await backendApi.updateBoard(board.id, { is_active: isActive });
    toast({ title: isActive ? "Board activated" : "Board deactivated" });
    queryClient.invalidateQueries({ queryKey: ["admin-curriculum-boards"] });
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBoardId) return;
    await backendApi.createClass({
      board_id: selectedBoardId,
      grade_number: Number(classForm.grade_number),
      name: classForm.name.trim(),
      description: cleanOptional(classForm.description)
    });
    setClassForm(emptyClassForm);
    toast({ title: "Class created" });
    queryClient.invalidateQueries({ queryKey: ["admin-curriculum-classes", selectedBoardId] });
  }

  async function saveClass(id: string) {
    await backendApi.updateClass(id, {
      grade_number: Number(editingClass.grade_number),
      name: editingClass.name.trim(),
      description: cleanOptional(editingClass.description)
    });
    setEditingClassId("");
    toast({ title: "Class updated" });
    queryClient.invalidateQueries({ queryKey: ["admin-curriculum-classes", selectedBoardId] });
  }

  async function setClassActive(item: ClassItem, isActive: boolean) {
    await backendApi.updateClass(item.id, { is_active: isActive });
    toast({ title: isActive ? "Class activated" : "Class deactivated" });
    queryClient.invalidateQueries({ queryKey: ["admin-curriculum-classes", selectedBoardId] });
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Curriculum" description="Create and maintain education boards and classes used by textbook uploads and teacher workflows." />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
        <Card>
          <CardHeader><CardTitle>Boards</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={createBoard} className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Code">
                  <Input value={boardForm.code} onChange={(event) => setBoardForm({ ...boardForm, code: event.target.value })} placeholder="cbse" required />
                </Field>
                <Field label="Name">
                  <Input value={boardForm.name} onChange={(event) => setBoardForm({ ...boardForm, name: event.target.value })} placeholder="Central Board" required />
                </Field>
              </div>
              <Field label="Description">
                <Textarea value={boardForm.description} onChange={(event) => setBoardForm({ ...boardForm, description: event.target.value })} placeholder="Optional notes for admins" />
              </Field>
              <Button type="submit" disabled={!boardForm.code.trim() || !boardForm.name.trim()}>
                <Plus className="h-4 w-4" />
                Create board
              </Button>
            </form>

            <div className="grid gap-3">
              {(boards.data?.items || []).map((board) => {
                const editing = editingBoardId === board.id;
                return (
                  <div key={board.id} className="rounded-[14px] border border-slate-100 bg-white p-3 shadow-sm">
                    {editing ? (
                      <div className="grid gap-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <Input value={editingBoard.code} onChange={(event) => setEditingBoard({ ...editingBoard, code: event.target.value })} />
                          <Input value={editingBoard.name} onChange={(event) => setEditingBoard({ ...editingBoard, name: event.target.value })} />
                        </div>
                        <Textarea value={editingBoard.description} onChange={(event) => setEditingBoard({ ...editingBoard, description: event.target.value })} />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingBoardId("")}><X className="h-4 w-4" />Cancel</Button>
                          <Button size="sm" onClick={() => saveBoard(board.id)}><Save className="h-4 w-4" />Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <button type="button" className="min-w-0 text-left" onClick={() => setSelectedBoardId(board.id)}>
                          <p className="truncate font-black text-slate-950">{board.name}</p>
                          <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{board.code}</p>
                          {board.description ? <p className="mt-2 text-sm text-slate-600">{board.description}</p> : null}
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <Badge>{board.is_active ? "active" : "inactive"}</Badge>
                          <Button size="icon" variant="ghost" title="Edit board" onClick={() => { setEditingBoardId(board.id); setEditingBoard({ code: board.code, name: board.name, description: board.description || "" }); }}><Edit3 className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title={board.is_active ? "Deactivate board" : "Activate board"} onClick={() => setBoardActive(board, !board.is_active)}>
                            {board.is_active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!boards.isLoading && !boards.data?.items?.length ? <p className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground">No boards created yet.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Classes</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <Field label="Board">
              <Select value={selectedBoardId} onChange={(event) => setSelectedBoardId(event.target.value)} disabled={boards.isLoading}>
                {(boards.data?.items || []).map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
              </Select>
            </Field>
            <form onSubmit={createClass} className="grid gap-3 md:grid-cols-[120px_1fr]">
              <Field label="Grade">
                <Input type="number" min={1} max={12} value={classForm.grade_number} onChange={(event) => setClassForm({ ...classForm, grade_number: event.target.value })} required />
              </Field>
              <Field label="Class name">
                <Input value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} placeholder="Class 8" required />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea value={classForm.description} onChange={(event) => setClassForm({ ...classForm, description: event.target.value })} placeholder="Optional notes for admins" />
                </Field>
              </div>
              <Button type="submit" className="md:col-span-2" disabled={!selectedBoardId || !classForm.grade_number || !classForm.name.trim()}>
                <Plus className="h-4 w-4" />
                Create class
              </Button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground"><tr>{["Grade", "Name", "Description", "Status", "Actions"].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}</tr></thead>
                <tbody>
                  {(classes.data?.items || []).map((item) => {
                    const editing = editingClassId === item.id;
                    return (
                      <tr key={item.id} className="border-t border-border">
                        {editing ? (
                          <>
                            <td className="px-3 py-3"><Input type="number" min={1} max={12} value={editingClass.grade_number} onChange={(event) => setEditingClass({ ...editingClass, grade_number: event.target.value })} /></td>
                            <td className="px-3 py-3"><Input value={editingClass.name} onChange={(event) => setEditingClass({ ...editingClass, name: event.target.value })} /></td>
                            <td className="px-3 py-3"><Input value={editingClass.description} onChange={(event) => setEditingClass({ ...editingClass, description: event.target.value })} /></td>
                            <td className="px-3 py-3"><Badge>{item.is_active ? "active" : "inactive"}</Badge></td>
                            <td className="px-3 py-3"><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => setEditingClassId("")}><X className="h-4 w-4" /></Button><Button size="icon" onClick={() => saveClass(item.id)}><Save className="h-4 w-4" /></Button></div></td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-3">{item.grade_number}</td>
                            <td className="px-3 py-3 font-semibold">{item.name}</td>
                            <td className="px-3 py-3 text-slate-600">{item.description || "-"}</td>
                            <td className="px-3 py-3"><Badge>{item.is_active ? "active" : "inactive"}</Badge></td>
                            <td className="px-3 py-3"><div className="flex gap-1"><Button size="icon" variant="ghost" title="Edit class" onClick={() => { setEditingClassId(item.id); setEditingClass({ grade_number: String(item.grade_number || ""), name: item.name, description: item.description || "" }); }}><Edit3 className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title={item.is_active ? "Deactivate class" : "Activate class"} onClick={() => setClassActive(item, !item.is_active)}>{item.is_active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}</Button></div></td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!classes.isLoading && selectedBoardId && !classes.data?.items?.length ? <p className="p-5 text-sm font-semibold text-muted-foreground">No classes found for this board.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cleanOptional(value: string) {
  return value.trim() || undefined;
}
