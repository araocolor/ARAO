"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, ArrowUp, ArrowDown } from "lucide-react";
import { TierBadge } from "@/components/tier-badge";
import Cropper, { Area } from "react-easy-crop";

interface Member {
  id: string;
  email: string;
  username: string | null;
  icon_image: string | null;
  created_at: string;
  tier: string | null;
  role: string;
  last_visited_at: string | null;
  visit_count: number | null;
}

type SortField = "username" | "email" | "created_at" | "tier";
type SortOrder = "asc" | "desc";

const TIER_ORDER = { premium: 0, pro: 1, general: 2 };

export function AdminMembersManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"username" | "email">("username");
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // 랜덤 아바타 업로드
  const [randomAvatarIndex, setRandomAvatarIndex] = useState(1);
  const [randomCropSource, setRandomCropSource] = useState<string | null>(null);
  const [randomCrop, setRandomCrop] = useState({ x: 0, y: 0 });
  const [randomZoom, setRandomZoom] = useState(1);
  const [randomCroppedAreaPixels, setRandomCroppedAreaPixels] = useState<Area | null>(null);
  const [randomUploading, setRandomUploading] = useState(false);
  const [randomMessage, setRandomMessage] = useState<string | null>(null);
  const [randomAvatarList, setRandomAvatarList] = useState<{ url: string }[]>([]);
  const randomFileInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ url: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberOrders, setMemberOrders] = useState<string[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [searchQuery, searchField, offset, sortField, sortOrder]);

  useEffect(() => {
    loadRandomAvatars();
  }, []);

  async function loadRandomAvatars() {
    const res = await fetch("/api/admin/random-avatar");
    if (!res.ok) return;
    const data = (await res.json()) as { avatars: { url: string }[] };
    const avatars = data.avatars ?? [];
    setRandomAvatarList(avatars);
    setRandomAvatarIndex(avatars.length + 1);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "created_at" ? "desc" : "asc");
    }
    setOffset(0);
  }

  function compareStrings(a: string, b: string, reverse: boolean): number {
    const cmp = a.localeCompare(b, "ko-KR", { numeric: true });
    return reverse ? -cmp : cmp;
  }

  function sortMembers(membersToSort: Member[]): Member[] {
    const sorted = [...membersToSort];
    const isReverse = sortOrder === "desc";

    if (sortField === "username") {
      sorted.sort((a, b) => {
        const aVal = a.username || "";
        const bVal = b.username || "";
        return compareStrings(aVal, bVal, isReverse);
      });
    } else if (sortField === "email") {
      sorted.sort((a, b) => compareStrings(a.email, b.email, isReverse));
    } else if (sortField === "created_at") {
      sorted.sort((a, b) => {
        const cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return isReverse ? -cmp : cmp;
      });
    } else if (sortField === "tier") {
      sorted.sort((a, b) => {
        const aVal = a.tier?.toLowerCase() || "general";
        const bVal = b.tier?.toLowerCase() || "general";
        const aOrder = TIER_ORDER[aVal as keyof typeof TIER_ORDER] ?? 999;
        const bOrder = TIER_ORDER[bVal as keyof typeof TIER_ORDER] ?? 999;
        const cmp = aOrder - bOrder;
        return isReverse ? -cmp : cmp;
      });
    }

    return sorted;
  }

  function getMembersCacheKey() {
    return `admin-members:${searchQuery}:${searchField}:${offset}:${sortField}:${sortOrder}`;
  }

  async function loadMembers(forceRefresh = false) {
    const cacheKey = getMembersCacheKey();
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { members: cachedMembers, total: cachedTotal } = JSON.parse(cached) as { members: Member[]; total: number };
          setMembers(cachedMembers);
          setTotal(cachedTotal);
          return;
        }
      } catch {}
    }
    try {
      setIsLoading(true);
      let url = `/api/admin/members?limit=${limit}&offset=${offset}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}&searchField=${searchField}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = (await response.json()) as { members: Member[]; total: number };
        const sortedMembers = sortMembers(data.members);
        setMembers(sortedMembers);
        setTotal(data.total);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ members: sortedMembers, total: data.total }));
        } catch {}
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Failed to load members:", error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR");
    } catch {
      return "날짜 오류";
    }
  }

  async function handleMemberClick(member: Member) {
    setSelectedMember(member);
    setMemberOrders([]);
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/members/orders?userId=${member.id}`);
      if (res.ok) {
        const data = (await res.json()) as { products: string[] };
        setMemberOrders(data.products ?? []);
      }
    } catch {}
    setIsLoadingOrders(false);
  }

  function handleCloseModal() {
    setSelectedMember(null);
    setMemberOrders([]);
  }

  function handleRandomFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRandomCropSource(ev.target?.result as string);
      setRandomCrop({ x: 0, y: 0 });
      setRandomZoom(1);
      setRandomCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
  }

  const onRandomCropComplete = useCallback((_: Area, pixels: Area) => {
    setRandomCroppedAreaPixels(pixels);
  }, []);

  async function buildRandomCroppedPreview(): Promise<string | null> {
    if (!randomCropSource || !randomCroppedAreaPixels) return null;
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = randomCropSource;
    });
    const canvas = document.createElement("canvas");
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(
      image,
      randomCroppedAreaPixels.x,
      randomCroppedAreaPixels.y,
      randomCroppedAreaPixels.width,
      randomCroppedAreaPixels.height,
      0, 0, size, size
    );
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  async function submitRandomAvatar() {
    if (!randomCropSource) return;
    setRandomUploading(true);
    setRandomMessage(null);
    const dataUrl = await buildRandomCroppedPreview();
    if (!dataUrl) {
      setRandomMessage("이미지 처리 실패");
      setRandomUploading(false);
      return;
    }
    const res = await fetch("/api/admin/random-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl, index: randomAvatarIndex }),
    });
    const data = (await res.json()) as { message?: string; name?: string; url?: string };
    setRandomMessage(data.message ?? "완료");
    setRandomUploading(false);
    if (res.ok) {
      setRandomCropSource(null);
      setRandomCroppedAreaPixels(null);
      if (randomFileInputRef.current) randomFileInputRef.current.value = "";
      await loadRandomAvatars();
    }
  }

  async function deleteRandomAvatar(url: string) {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/random-avatar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as { message?: string };
      setRandomMessage(data.message ?? "삭제 실패");
      if (res.ok) {
        await loadRandomAvatars();
      }
    } catch (error) {
      setRandomMessage("삭제 중 오류 발생");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmModal(null);
    }
  }

  return (
    <div className="admin-members-list-wrap">
      <div className="admin-members-search-wrap">
        <select
          value={searchField}
          onChange={(e) => {
            setSearchField(e.target.value as "username" | "email");
            setOffset(0);
            setSearchQuery("");
          }}
          className="admin-members-search-select"
        >
          <option value="username">아이디</option>
          <option value="email">이메일</option>
        </select>
        <input
          type="text"
          placeholder="검색..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOffset(0);
          }}
          className="admin-members-search-input"
        />
        <button
          type="button"
          className="admin-members-refresh-btn"
          onClick={() => loadMembers(true)}
          disabled={isLoading}
        >
          {isLoading ? "로딩중..." : "갱신"}
        </button>
      </div>

      <div className="admin-members-table-wrap">
        <table className="admin-members-table">
          <thead className="admin-members-table-head">
            <tr>
              <th className="admin-members-avatar-cell">아바타</th>
              <th className="admin-members-sortable admin-members-username" onClick={() => handleSort("username")}>
                아이디
                {sortField === "username" && (
                  sortOrder === "asc" ? <ArrowUp width={14} height={14} /> : <ArrowDown width={14} height={14} />
                )}
              </th>
              <th className="admin-members-sortable admin-members-date" onClick={() => handleSort("created_at")}>
                가입일
                {sortField === "created_at" && (
                  sortOrder === "asc" ? <ArrowUp width={14} height={14} /> : <ArrowDown width={14} height={14} />
                )}
              </th>
              <th className="admin-members-sortable admin-members-tier" onClick={() => handleSort("tier")}>
                Tier
                {sortField === "tier" && (
                  sortOrder === "asc" ? <ArrowUp width={14} height={14} /> : <ArrowDown width={14} height={14} />
                )}
              </th>
              <th className="admin-members-role">Role</th>
              <th className="admin-members-visit">방문</th>
            </tr>
          </thead>
          <tbody className="admin-members-table-body">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="admin-members-loading">로딩 중...</td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-members-empty">회원이 없습니다.</td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="admin-members-table-row">
                  <td className="admin-members-avatar-cell">
                    <button
                      type="button"
                      className="admin-members-avatar-btn"
                      onClick={() => handleMemberClick(member)}
                      aria-label="상세보기"
                    >
                      {member.icon_image ? (
                        <img src={member.icon_image} alt={member.username || "avatar"} className="admin-members-avatar" />
                      ) : (
                        <div className="admin-members-avatar-placeholder" />
                      )}
                    </button>
                  </td>
                  <td className="admin-members-username">{member.username || "-"}</td>
                  <td className="admin-members-date">
                    <div>{formatDate(member.created_at)}</div>
                    {member.last_visited_at && (
                      <div className="admin-members-last-visited">{formatDate(member.last_visited_at)}</div>
                    )}
                  </td>
                  <td className="admin-members-tier">
                    <TierBadge tier={member.tier} size={16} marginLeft={0} />
                    {!member.tier || (member.tier !== "pro" && member.tier !== "premium") ? (member.tier === "general" ? "." : (member.tier || "-")) : null}
                  </td>
                  <td className="admin-members-role">
                    {member.role === "admin" ? "admin" : "mem"}
                  </td>
                  <td className="admin-members-visit">{member.visit_count ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-members-pagination">
        <span className="admin-members-count">총 {total}명</span>
        <div className="admin-members-pagination-buttons">
          <button
            type="button"
            className="admin-members-pagination-btn"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
          >
            이전
          </button>
          <span className="admin-members-page-info">
            {Math.floor(offset / limit) + 1} / {Math.ceil(total / limit) || 1}
          </span>
          <button
            type="button"
            className="admin-members-pagination-btn"
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
          >
            다음
          </button>
        </div>
      </div>

      {selectedMember && typeof document !== "undefined" && createPortal(
        <div className="admin-members-modal-overlay" onClick={handleCloseModal}>
          <div className="admin-members-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="admin-members-modal-close" onClick={handleCloseModal}>✕</button>
            <div className="admin-members-detail-avatar">
              {selectedMember.icon_image ? (
                <img src={selectedMember.icon_image} alt={selectedMember.username || "avatar"} />
              ) : (
                <div className="admin-members-detail-avatar-placeholder" />
              )}
            </div>
            <div className="admin-members-detail-info">
              <div className="admin-members-detail-row">
                <span className="admin-members-label">아이디</span>
                <span className="admin-members-value">{selectedMember.username || "-"}</span>
              </div>
              <div className="admin-members-detail-row">
                <span className="admin-members-label">이메일</span>
                <span className="admin-members-value">{selectedMember.email}</span>
              </div>
              <div className="admin-members-detail-row">
                <span className="admin-members-label">가입일</span>
                <span className="admin-members-value">{formatDate(selectedMember.created_at)}</span>
              </div>
              <div className="admin-members-detail-row">
                <span className="admin-members-label">티어</span>
                <span className="admin-members-value">{selectedMember.tier || "-"}</span>
              </div>
              <div className="admin-members-detail-row">
                <span className="admin-members-label">Role</span>
                <span className="admin-members-value">{selectedMember.role === "admin" ? "admin" : "mem"}</span>
              </div>
              <div className="admin-members-detail-row">
                <span className="admin-members-label">최근방문</span>
                <span className="admin-members-value">{selectedMember.last_visited_at ? formatDate(selectedMember.last_visited_at) : "-"}</span>
              </div>
              <div className="admin-members-detail-row">
                <span className="admin-members-label">방문횟수</span>
                <span className="admin-members-value">{selectedMember.visit_count ?? 0}회</span>
              </div>
              <div className="admin-members-detail-row">
                <span className="admin-members-label">상품구매</span>
                <span className="admin-members-value">
                  {isLoadingOrders ? "조회중..." : memberOrders.length > 0 ? memberOrders.join(", ") : "해당없음"}
                </span>
              </div>
            </div>
            <div className="admin-members-modal-footer">
              <button type="button" className="admin-members-modal-confirm" onClick={handleCloseModal}>확인</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 랜덤 아바타 업로드 섹션 */}
      <div className="random-avatar-section">
        <div className="random-avatar-section-title">랜덤 아바타 업로드</div>
        <div className="random-avatar-index-wrap">
          <span className="random-avatar-index-label">번호</span>
          <input
            type="number"
            min={1}
            max={40}
            value={randomAvatarIndex}
            onChange={(e) => setRandomAvatarIndex(Number(e.target.value))}
            className="random-avatar-index-input"
          />
        </div>

        {randomCropSource && (
          <div className="random-avatar-cropper-wrap">
            <div className="random-avatar-cropper">
              <Cropper
                image={randomCropSource}
                crop={randomCrop}
                zoom={randomZoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setRandomCrop}
                onZoomChange={setRandomZoom}
                onCropComplete={onRandomCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={randomZoom}
              onChange={(e) => setRandomZoom(Number(e.target.value))}
              className="random-avatar-zoom-slider"
              aria-label="줌"
            />
          </div>
        )}

        <input
          ref={randomFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          className="random-avatar-file-hidden"
          onChange={handleRandomFileChange}
        />

        <div className="random-avatar-actions">
          {!randomCropSource ? (
            <button
              type="button"
              className="random-avatar-select-btn"
              onClick={() => randomFileInputRef.current?.click()}
            >
              사진 선택
            </button>
          ) : (
            <>
              <button
                type="button"
                className="random-avatar-upload-btn"
                onClick={submitRandomAvatar}
                disabled={randomUploading}
              >
                {randomUploading ? "업로드 중..." : "업로드"}
              </button>
              <button
                type="button"
                className="random-avatar-cancel-btn"
                onClick={() => {
                  setRandomCropSource(null);
                  setRandomCroppedAreaPixels(null);
                  if (randomFileInputRef.current) randomFileInputRef.current.value = "";
                }}
              >
                취소
              </button>
            </>
          )}
        </div>

        {randomMessage && <div className="random-avatar-message">{randomMessage}</div>}

        {randomAvatarList.length > 0 && (
          <div className="random-avatar-grid">
            {randomAvatarList.map((item) => (
              <div key={item.url} className="random-avatar-grid-item-wrapper">
                <img src={item.url} alt="" className="random-avatar-grid-item" />
                <button
                  className="random-avatar-delete-btn"
                  onClick={() => setDeleteConfirmModal({ url: item.url })}
                  type="button"
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {deleteConfirmModal && (
          <div className="random-avatar-modal-overlay" onClick={() => setDeleteConfirmModal(null)}>
            <div className="random-avatar-modal" onClick={(e) => e.stopPropagation()}>
              <p className="random-avatar-modal-text">이 아바타를 삭제하시겠습니까?</p>
              <div className="random-avatar-modal-buttons">
                <button
                  className="random-avatar-modal-btn cancel"
                  onClick={() => setDeleteConfirmModal(null)}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="random-avatar-modal-btn delete"
                  onClick={() => deleteRandomAvatar(deleteConfirmModal.url)}
                  type="button"
                  disabled={isDeleting}
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
