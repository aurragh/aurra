import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, Shirt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type WardrobeItem } from "@shared/schema";

const CATEGORIES = ["All", "Tops", "Bottoms", "Shoes", "Outerwear", "Accessories"] as const;
type Category = (typeof CATEGORIES)[number];

const SEASONS = ["All Year", "Spring-Summer", "Fall-Winter"];

const CATEGORY_COLORS: Record<string, string> = {
  Tops: "#7c3aed",
  Bottoms: "#0891b2",
  Shoes: "#b45309",
  Outerwear: "#166534",
  Accessories: "#9d174d",
};

function ColorDot({ color }: { color?: string }) {
  if (!color) return null;
  return (
    <div
      className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
      style={{ background: color.toLowerCase() === "black" ? "#111" : color.toLowerCase() === "white" ? "#f5f5f5" : color }}
      title={color}
    />
  );
}

interface AddItemFormProps {
  onClose: () => void;
  onSave: (data: Omit<WardrobeItem, "id" | "userId" | "createdAt">) => void;
  isSaving: boolean;
}

function AddItemForm({ onClose, onSave, isSaving }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tops");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [season, setSeason] = useState("All Year");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), category, color: color.trim() || undefined, brand: brand.trim() || undefined, season: season || undefined, notes: notes.trim() || undefined } as any);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #130d1a, #0d0812)", border: "1px solid rgba(168,85,247,0.2)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-white font-semibold">Add Clothing Item</p>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/5">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Item Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Black wool blazer"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-200 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Category *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(1).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: category === cat ? CATEGORY_COLORS[cat] + "33" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${category === cat ? CATEGORY_COLORS[cat] + "88" : "rgba(255,255,255,0.08)"}`,
                    color: category === cat ? "#e2d9f3" : "#9ca3af",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Navy"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-200 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Uniqlo"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-200 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Season</label>
            <div className="flex gap-2">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeason(s)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: season === s ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${season === s ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                    color: season === s ? "#c4b5fd" : "#6b7280",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..."
              className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-200 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
            >
              {isSaving ? "Saving..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Wardrobe() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [showForm, setShowForm] = useState(false);

  const { data: items = [] } = useQuery<WardrobeItem[]>({
    queryKey: ["/api/wardrobe"],
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/wardrobe", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wardrobe"] });
      setShowForm(false);
      toast({ title: "Item added", description: "Added to your wardrobe." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/wardrobe/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wardrobe"] });
      toast({ title: "Item removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove item.", variant: "destructive" });
    },
  });

  const filtered = activeCategory === "All"
    ? items
    : items.filter((i) => i.category === activeCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0812" }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0d0812 0%, #130d1a 60%, #0d0812 100%)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
        style={{
          background: "rgba(13,8,18,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(168,85,247,0.1)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/dashboard")}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <p className="text-white font-semibold text-sm">My Wardrobe</p>
            <p className="text-purple-400/60 text-xs">{items.length} {items.length === 1 ? "item" : "items"}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
      </div>

      {/* Category tabs */}
      <div
        className="px-4 py-3 overflow-x-auto sticky top-14 z-10"
        style={{ background: "rgba(13,8,18,0.88)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((cat) => {
            const count = cat === "All" ? items.length : items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background:
                    activeCategory === cat
                      ? cat === "All"
                        ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                        : CATEGORY_COLORS[cat] + "33"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    activeCategory === cat
                      ? cat === "All"
                        ? "transparent"
                        : CATEGORY_COLORS[cat] + "66"
                      : "rgba(255,255,255,0.08)"
                  }`,
                  color: activeCategory === cat ? "#e2d9f3" : "#6b7280",
                }}
              >
                {cat} {count > 0 && <span className="opacity-60 ml-0.5">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Item grid */}
      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Shirt className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400 font-medium mb-1">
              {activeCategory === "All" ? "Your wardrobe is empty." : `No ${activeCategory} yet.`}
            </p>
            <p className="text-gray-600 text-sm mb-6">Add your first piece to start building your digital closet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
            >
              Add Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="p-3.5">
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: (CATEGORY_COLORS[item.category] || "#6b7280") + "22",
                        color: CATEGORY_COLORS[item.category] || "#9ca3af",
                        border: `1px solid ${(CATEGORY_COLORS[item.category] || "#6b7280") + "44"}`,
                      }}
                    >
                      {item.category}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>

                  {/* Name */}
                  <p className="text-gray-100 text-sm font-medium leading-tight mb-2">{item.name}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.color && <ColorDot color={item.color} />}
                    {item.color && <span className="text-gray-500 text-xs">{item.color}</span>}
                    {item.brand && (
                      <span className="text-gray-600 text-xs">· {item.brand}</span>
                    )}
                  </div>

                  {item.season && item.season !== "All Year" && (
                    <p className="text-gray-600 text-xs mt-1.5">{item.season}</p>
                  )}

                  {item.notes && (
                    <p className="text-gray-600 text-xs mt-1.5 italic leading-tight">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add item form modal */}
      {showForm && (
        <AddItemForm
          onClose={() => setShowForm(false)}
          onSave={(data) => addMutation.mutate(data)}
          isSaving={addMutation.isPending}
        />
      )}
    </div>
  );
}
