import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateWorkspace } from "@/hooks/use-verdicta-query";
import { useNavigate } from "react-router-dom";

const US_STATES = [
  "Federal (All)", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas",
  "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

export const CreateWorkspaceDialog = ({
  open,
  onOpenChange,
  trigger
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}) => {
  const navigate = useNavigate();
  const createWorkspace = useCreateWorkspace();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jurisdiction, setJurisdiction] = useState("Federal (All)");

  const handleCreate = async () => {
    if (!title.trim()) return;
    const workspace = await createWorkspace.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      jurisdiction,
      tags: [],
      defaultChatMode: "research",
      preferredCitationStyle: "Bluebook",
      preferredWritingMode: "Professional",
      preferredProvider: "local",
      preferredModel: "auto"
    });
    onOpenChange?.(false);
    navigate(`/workspaces/${workspace.id}`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-[32px] border border-border/80 bg-background/50 p-8 shadow-sm backdrop-blur-3xl transition-all outline-none">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold tracking-tight text-foreground">
              New Legal Workspace
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-2 hover:bg-accent/40 text-muted-foreground transition-colors cursor-pointer outline-none">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Configure the default jurisdictional scope and matter details to start grounding resources.
          </Dialog.Description>

          <div className="mt-6 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Matter Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smith v. Jones Appellate Brief"
                className="bg-card/40 border-border/60 focus-visible:ring-primary shadow-sm h-11"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jurisdiction / Region</label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="flex w-full h-11 items-center justify-between rounded-[10px] border border-border/60 bg-card/40 px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 outline-none"
              >
                {US_STATES.map((state) => (
                  <option key={state} value={state} className="bg-background text-foreground">
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Objective (Optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of research goals..."
                className="bg-card/40 border-border/60 focus-visible:ring-primary shadow-sm h-11"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" className="rounded-[10px] h-10 px-4 font-semibold hover:bg-accent/40">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleCreate}
              disabled={createWorkspace.isPending || !title.trim()}
              className="rounded-[10px] h-10 px-6 font-semibold"
            >
              {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
