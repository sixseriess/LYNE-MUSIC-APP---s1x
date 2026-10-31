import { useEffect, useMemo, useState } from "react";
import { AddLine, CheckLine, Search2Line } from "@mingcute/react";
import { useSearchTracks } from "@/features/search";
import { useAddPlaylistTracks } from "../hooks/useLibraryMutations";
import type { Track } from "@/shared/types";
import { ApiError } from "@/shared/api";
import { useToast } from "@/shared/ui";
import Button from "@/shared/ui/Button";
import Dialog from "@/shared/ui/Dialog";
import { DialogHeader } from "@/shared/ui/DialogActions";
import SongCardWithMenu from "@/features/player/ui/SongCardWithMenu";

interface AddSongsModalProps {
  open: boolean;
  playlistId: string;
  playlistTitle: string;
  existingTracks: Track[];
  onClose: () => void;
}

export default function AddSongsModal({
  open,
  playlistId,
  playlistTitle,
  existingTracks,
  onClose,
}: AddSongsModalProps) {
  const [query, setQuery] = useState("");
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [addedTrackIds, setAddedTrackIds] = useState<Set<string>>(
    () => new Set(),
  );
  const { tracks, loading, hasLoaded, error } = useSearchTracks(query, {
    enabled: open,
    debounceMs: 260,
  });
  const addTracks = useAddPlaylistTracks();
  const { toast } = useToast();

  const existingTrackIds = useMemo(
    () => new Set(existingTracks.map((track) => track.id)),
    [existingTracks],
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setAddedTrackIds(new Set());
    setAddingTrackId(null);
  }, [open, playlistId]);

  const handleAdd = async (track: Track) => {
    if (addingTrackId || existingTrackIds.has(track.id) || addedTrackIds.has(track.id)) {
      return;
    }
    setAddingTrackId(track.id);
    try {
      await addTracks.mutateAsync({ playlistId, trackId: track.id });
      setAddedTrackIds((current) => new Set(current).add(track.id));
      toast("Added to playlist", "checkmark", {
        description: `${track.title} · ${playlistTitle}`,
      });
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        setAddedTrackIds((current) => new Set(current).add(track.id));
        toast("Already in playlist", "info", { description: track.title });
      } else {
        toast("Couldn't add song", "error", {
          description:
            cause instanceof Error ? cause.message : "Please try again.",
        });
      }
    } finally {
      setAddingTrackId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (!next ? onClose() : undefined)}
      maxWidth={650}
      maxHeight="82vh"
      className="!p-0"
    >
      <div className="flex min-h-0 flex-col px-[20px] pt-[20px] pb-[16px]">
        <DialogHeader
          title="Add Songs"
          description={`Search for music to add to ${playlistTitle}.`}
        />
        <div className="mt-[16px] flex h-[42px] shrink-0 items-center gap-[10px] rounded-[11px] border border-border-alpha-14 bg-black/[0.04] px-[12px] dark:bg-white/[0.05]">
          <Search2Line size={17} className="shrink-0 text-text-tertiary" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search songs or artists"
            aria-label="Search songs or artists"
            className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] text-text-primary outline-none placeholder:text-text-tertiary"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="mt-[12px] min-h-[180px] flex-1 overflow-y-auto overscroll-contain">
          {query.trim().length < 2 ? (
            <div className="flex h-[180px] items-center justify-center px-[18px] text-center text-[13px] text-text-tertiary">
              Search for a song to add it to this playlist.
            </div>
          ) : loading ? (
            <div className="flex h-[180px] items-center justify-center text-[13px] text-text-tertiary">
              Searching…
            </div>
          ) : error ? (
            <div className="flex h-[180px] items-center justify-center text-[13px] text-text-tertiary">
              Couldn't search right now. Try again.
            </div>
          ) : hasLoaded && tracks.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-[13px] text-text-text-tertiary">
              No songs found.
            </div>
          ) : (
            <div className="flex flex-col gap-[4px]">
              {tracks.map((track) => {
                const added =
                  existingTrackIds.has(track.id) || addedTrackIds.has(track.id);
                const isAdding = addingTrackId === track.id;
                return (
                  <SongCardWithMenu
                    key={track.id}
                    id={track.id}
                    title={track.title}
                    artists={track.artists}
                    artistId={track.artistId}
                    artistList={track.artistList}
                    coverUrl={track.coverUrl}
                    durationMs={track.durationMs}
                    explicit={track.explicit}
                    trailingAction={
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={added || Boolean(addingTrackId)}
                        onClick={() => void handleAdd(track)}
                        className="!h-[30px] !rounded-[8px] !px[10px] !text-[12px]"
                      >
                        {added ? (
                          <CheckLine size={15} />
                        ) : (
                          <AddLine size={15} />
                        )}
                        <span>{added ? "Added" : isAdding ? "Adding…" : "Add"}</span>
                      </Button>
                      }
                  />
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-[14px] flex justify-end border-t border-border-alpha-8 pt-[12px]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="!h-[34px] !rounded-[9px]"
          >
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
