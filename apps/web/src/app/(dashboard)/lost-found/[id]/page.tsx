"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, RotateCcw, Trash2, Link2, Pencil } from "lucide-react";
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

/* ── Mock Item ── */
const ITEM = {
  id: "1",
  itemNumber: "FND-001",
  status: "stored",
  description: "Black leather wallet with driver's license and two credit cards inside. No cash visible. License belongs to a male, last name partially visible as 'Tor...'",
  category: "Wallet / Purse",
  color: "Black",
  locationFound: "Main Stage Area — Row G, Seat 14",
  foundBy: "Officer Rivera",
  foundDate: "April 5, 2026 at 2:15 PM",
  storageLocation: "Lost & Found Office — Bin A-12",
  photoUrl: null as string | null,
};

export default function LostFoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
            {ITEM.itemNumber}
          </h1>
          <StatusBadge status={ITEM.status} dot />
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
                {ITEM.description}
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
                  {ITEM.category}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Color
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {ITEM.color}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Location Found
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {ITEM.locationFound}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Found By
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {ITEM.foundBy}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Date Found
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {ITEM.foundDate}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Storage Location
                </label>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {ITEM.storageLocation}
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
          console.log("Edit found item:", data);
          setShowEditModal(false);
        }}
        initialData={{
          description: ITEM.description,
          category: ITEM.category,
          foundLocation: ITEM.locationFound,
          foundBy: ITEM.foundBy,
          storageLocation: ITEM.storageLocation,
        }}
      />
      <ClaimItemModal
        open={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onSubmit={async (data) => {
          console.log("Claim item:", data);
          setShowClaimModal(false);
        }}
      />
      <ReturnItemModal
        open={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={async () => {
          console.log("Return item:", id);
          setShowReturnModal(false);
        }}
        itemDescription={ITEM.description}
        claimantName=""
      />
      <DisposalModal
        open={showDisposalModal}
        onClose={() => setShowDisposalModal(false)}
        onConfirm={async (reason) => {
          console.log("Dispose item:", reason);
          setShowDisposalModal(false);
        }}
        itemDescription={ITEM.description}
        daysHeld={30}
      />
      <DeleteFoundItemModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async (reason) => {
          console.log("Delete found item:", reason);
          setShowDeleteModal(false);
        }}
        itemDescription={ITEM.description}
      />
    </div>
  );
}
