"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, GraduationCap, Layers3, PauseCircle, PlayCircle, Plus, Save, Search, X } from "lucide-react";
import { backendApi, type Board, type ClassItem } from "@/lib/api";
import { Field } from "@/components/field";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type BoardForm = { code: string; name: string; description: string };
type ClassForm = { grade_number: string; name: string; description: string };

const emptyBoardForm: BoardForm = { code: "", name: "", description: "" };
const emptyClassForm: ClassForm = { grade_number: "", name: "", description: "" };

export default function AdminCurriculumPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const boards = useQuery({ queryKey: ["admin-curriculum-boards"], queryFn: () => backendApi.boards(0, 100) });
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [boardSearch, setBoardSearch] = useState("");
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

  const selectedBoard = boards.data?.items?.find((board) => board.id === selectedBoardId);
  const filteredBoards = useMemo(() => {
    const search = boardSearch.trim().toLowerCase();
    const items = boards.data?.items || [];
    if (!search) return items;
    return items.filter((board) =>
      [board.code, board.name, board.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [boardSearch, boards.data?.items]);
  const activeBoards = boards.data?.items?.filter((board) => board.is_active).length || 0;
  const activeClasses = classes.data?.items?.filter((item) => item.is_active).length || 0;

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
    <>
      <AdminPageHeader
        eyebrow="Academic structure"
        title="Curriculum"
        description="Manage boards and classes that organize content and teacher workflows."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Boards" value={boards.data?.total ?? 0} detail={`${activeBoards} active`} tone="blue" icon={<Layers3 className="h-5 w-5" />} />
        <MetricCard label="Classes" value={classes.data?.total ?? 0} detail={`${activeClasses} active`} tone="green" icon={<GraduationCap className="h-5 w-5" />} />
        <MetricCard label="Selected Board" value={selectedBoard?.code?.toUpperCase() || "-"} detail={selectedBoard?.name || "No board selected"} tone="amber" icon={<Search className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel
          title="Boards"
          description="Create and manage education boards."
          actions={
            <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 sm:w-64">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                className="h-7 border-0 bg-transparent px-0 shadow-none focus:ring-0"
                placeholder="Search boards..."
                value={boardSearch}
                onChange={(event) => setBoardSearch(event.target.value)}
              />
            </div>
          }
        >
          <form onSubmit={createBoard} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code">
                <Input value={boardForm.code} onChange={(event) => setBoardForm({ ...boardForm, code: event.target.value })} placeholder="cbse" required />
              </Field>
              <Field label="Name">
                <Input value={boardForm.name} onChange={(event) => setBoardForm({ ...boardForm, name: event.target.value })} placeholder="Central Board" required />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={boardForm.description} onChange={(event) => setBoardForm({ ...boardForm, description: event.target.value })} placeholder="Optional description" />
            </Field>
            <Button type="submit" disabled={!boardForm.code.trim() || !boardForm.name.trim()}>
              <Plus className="h-4 w-4" />
              Create Board
            </Button>
          </form>

          <div className="mt-4 space-y-3">
            {boards.isLoading ? <LoadingState label="Loading boards" /> : null}
            {!boards.isLoading && !filteredBoards.length ? <EmptyState title="No boards found" /> : null}
            {filteredBoards.map((board) => {
              const editing = editingBoardId === board.id;
              const selected = selectedBoardId === board.id;
              return (
                <div key={board.id} className={cn(
                  "rounded-xl border p-4 transition-all",
                  selected ? "border-indigo-200 bg-indigo-50/50" : "border-gray-200 bg-white"
                )}>
                  {editing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
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
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelectedBoardId(board.id)}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-gray-900">{board.name}</p>
                          <StatusPill status={board.is_active ? "success" : "danger"}>{board.is_active ? "active" : "inactive"}</StatusPill>
                        </div>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-500">{board.code}</p>
                        {board.description ? <p className="mt-2 line-clamp-2 text-sm text-gray-600">{board.description}</p> : null}
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button size="icon" variant="ghost" title="Edit board" onClick={() => { setEditingBoardId(board.id); setEditingBoard({ code: board.code, name: board.name, description: board.description || "" }); }}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title={board.is_active ? "Deactivate board" : "Activate board"} onClick={() => setBoardActive(board, !board.is_active)}>
                          {board.is_active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Classes"
          description={selectedBoard ? `Manage classes under ${selectedBoard.name}.` : "Select a board to manage classes."}
          actions={
            <Select value={selectedBoardId} onChange={(event) => setSelectedBoardId(event.target.value)} disabled={boards.isLoading} className="w-full sm:w-56">
              {(boards.data?.items || []).map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
            </Select>
          }
        >
          <form onSubmit={createClass} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
              <Field label="Grade">
                <Input type="number" min={1} max={12} value={classForm.grade_number} onChange={(event) => setClassForm({ ...classForm, grade_number: event.target.value })} required />
              </Field>
              <Field label="Class Name">
                <Input value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} placeholder="Class 8" required />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={classForm.description} onChange={(event) => setClassForm({ ...classForm, description: event.target.value })} placeholder="Optional description" />
            </Field>
            <Button type="submit" disabled={!selectedBoardId || !classForm.grade_number || !classForm.name.trim()}>
              <Plus className="h-4 w-4" />
              Create Class
            </Button>
          </form>

          <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
            {classes.isLoading ? <div className="p-4"><LoadingState label="Loading classes" /></div> : null}
            {!classes.isLoading && selectedBoardId && !classes.data?.items?.length ? <div className="p-4"><EmptyState title="No classes found" /></div> : null}
            {classes.data?.items?.length ? (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    {["Grade", "Name", "Description", "Status", "Actions"].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(classes.data?.items || []).map((item) => {
                    const editing = editingClassId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        {editing ? (
                          <>
                            <td className="px-4 py-3"><Input type="number" min={1} max={12} value={editingClass.grade_number} onChange={(event) => setEditingClass({ ...editingClass, grade_number: event.target.value })} /></td>
                            <td className="px-4 py-3"><Input value={editingClass.name} onChange={(event) => setEditingClass({ ...editingClass, name: event.target.value })} /></td>
                            <td className="px-4 py-3"><Input value={editingClass.description} onChange={(event) => setEditingClass({ ...editingClass, description: event.target.value })} /></td>
                            <td className="px-4 py-3"><StatusPill status={item.is_active ? "success" : "danger"}>{item.is_active ? "active" : "inactive"}</StatusPill></td>
                            <td className="px-4 py-3"><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => setEditingClassId("")}><X className="h-4 w-4" /></Button><Button size="icon" onClick={() => saveClass(item.id)}><Save className="h-4 w-4" /></Button></div></td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-bold text-gray-900">{item.grade_number || "-"}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                            <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">{item.description || "-"}</td>
                            <td className="px-4 py-3"><StatusPill status={item.is_active ? "success" : "danger"}>{item.is_active ? "active" : "inactive"}</StatusPill></td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" title="Edit class" onClick={() => { setEditingClassId(item.id); setEditingClass({ grade_number: String(item.grade_number || ""), name: item.name, description: item.description || "" }); }}>
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" title={item.is_active ? "Deactivate class" : "Activate class"} onClick={() => setClassActive(item, !item.is_active)}>
                                  {item.is_active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : null}
          </div>
        </AdminPanel>
      </div>
    </>
  );
}

function cleanOptional(value: string) {
  return value.trim() || undefined;
}