"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, RotateCcw, Trash2, Link2, Pencil, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import {
  EditFoundItemModal,
  ClaimItemModal,
  ReturnItemModal,
  DisposalModal,
  DeleteFoundItemModal,
} from "@/components/modals/lost-found";
import {
  fetchFoundItemById,
  updateFoundItemStatus,
  deleteFoundItem,
  type FoundItemDetail,
} from "@/lib/queries/lost-found";
import { formatDateTime } from "@/lib/utils/time";
import { useToast } from "@/components/ui/Toast";

export default function LostFoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const [item, setItem] = useState<FoundItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadItem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFoundItemById(id);
      setItem(data);
    } catch (err: any) {
      setError(err.message || "Failed to load item");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={24} className="text-[var(--status-critical)]" />
        <p className="text-[13px] text-[var(--text-tertiary)]">{error || "Item not found"}</p>
        <Link href="/lost-found"><Button variant="outline" size="sm">Back to Lost &amp; Found</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* ── Back + Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/lost-found"
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {item.recordNumber}
          </h1>
          <StatusBadge status={item.status} dot />
        </div>
      </div>

      {/* ── Item Details Card ── */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Description
              </label>
              <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Photo placeholder */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Photo
              </label>
              <div className="h-40 rounded-lg border-2 border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-1" />
                  <span className="text-[12px] text-[var(--text-tertiary)]">
                    No photo attached
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Category
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {item.category}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Color
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {"-"}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Location Found
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {item.foundLocation?.name || "Unknown"}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Found By
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {item.foundBy || "Unknown"}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Date Found
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {formatDateTime(item.foundAt)}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Storage Location
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {item.storageLocation || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-2">
        <Button size="md" variant="outline" onClick={() => setShowEditModal(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button size="md" variant="outline" onClick={() => setShowClaimModal(true)}>
          <Link2 className="h-3.5 w-3.5" />
          Claim
        </Button>
        <Button size="md" variant="default" onClick={() => setShowReturnModal(true)}>
          <RotateCcw className="h-3.5 w-3.5" />
          Mark as Returned
        </Button>
        <Button size="md" variant="outline" onClick={() => setShowDisposalModal(true)}>
          <Trash2 className="h-3.5 w-3.5" />
          Dispose
        </Button>
        <Button size="md" variant="destructive" onClick={() => setShowDeleteModal(true)}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      {/* ── Modals ── */}
      <EditFoundItemModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={async (data) => {
          toast("Item updated", { variant: "success" });
          setShowEditModal(false);
          loadItem();
        }}
        initialData={{
          description: item.description,
          category: item.category,
          foundLocation: item.foundLocation?.name || "Unknown",
          foundBy: item.foundBy || "Unknown",
          storageLocation: item.storageLocation || "Not specified",
        }}
      />
      <ClaimItemModal
        open={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onSubmit={async (data) => {
          toast("Item claimed", { variant: "success" });
          setShowClaimModal(false);
        }}
      />
      <ReturnItemModal
        open={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={async () => {
          try {
            await updateFoundItemStatus(id, "returned");
            toast("Item marked as returned", { variant: "success" });
            setShowReturnModal(false);
            loadItem();
          } catch (err: any) {
            toast(err.message || "Failed to update", { variant: "error" });
          }
        }}
        itemDescription={item.description}
        claimantName=""
      />
      <DisposalModal
        open={showDisposalModal}
        onClose={() => setShowDisposalModal(false)}
        onConfirm={async (reason) => {
          try {
            await updateFoundItemStatus(id, "disposed");
            toast("Item disposed", { variant: "success" });
            setShowDisposalModal(false);
            loadItem();
          } catch (err: any) {
            toast(err.message || "Failed to dispose", { variant: "error" });
          }
        }}
        itemDescription={item.description}
        daysHeld={30}
      />
      <DeleteFoundItemModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async (reason) => {
          try {
            await deleteFoundItem(id);
            toast("Item deleted", { variant: "info" });
            setShowDeleteModal(false);
            window.location.href = "/lost-found";
          } catch (err: any) {
            toast(err.message || "Failed to delete", { variant: "error" });
          }
        }}
        itemDescription={item.description}
      />
    </div>
  );
}
