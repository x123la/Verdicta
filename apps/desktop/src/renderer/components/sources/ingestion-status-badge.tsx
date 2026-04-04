import { Badge } from "@verdicta/ui";

export const IngestionStatusBadge = ({ status }: { status: string }) => <Badge>{status.replaceAll("_", " ")}</Badge>;
