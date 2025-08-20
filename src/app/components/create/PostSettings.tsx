import {
  Eye,
  EyeOff,
  MessageCircle,
  MessageCircleOff,
  Globe,
  Users,
  Lock,
  Heart,
  HeartOff,
} from "lucide-react";

interface PostSettingsProps {
  visibility: "public" | "followers" | "private";
  setVisibility: (visibility: "public" | "followers" | "private") => void;
  allowComments: boolean;
  setAllowComments: (allow: boolean) => void;
  hideViews: boolean;
  setHideViews: (hide: boolean) => void;
  hideLikes: boolean;
  setHideLikes: (hide: boolean) => void;
}

export default function PostSettings({
  visibility,
  setVisibility,
  allowComments,
  setAllowComments,
  hideViews,
  setHideViews,
  hideLikes,
  setHideLikes,
}: PostSettingsProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
      <h3 className="font-semibold mb-4">게시글 설정</h3>

      {/* 공개 범위 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          공개 범위
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === "public"}
              onChange={(e) => setVisibility(e.target.value as "public")}
              className="mr-2"
            />
            <Globe size={16} className="mr-2 text-green-600" />
            <span>전체 공개</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="followers"
              checked={visibility === "followers"}
              onChange={(e) => setVisibility(e.target.value as "followers")}
              className="mr-2"
            />
            <Users size={16} className="mr-2 text-blue-600" />
            <span>팔로워만</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === "private"}
              onChange={(e) => setVisibility(e.target.value as "private")}
              className="mr-2"
            />
            <Lock size={16} className="mr-2 text-gray-600" />
            <span>비공개</span>
          </label>
        </div>
      </div>

      {/* 토글 설정들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex items-center justify-between p-3 bg-white rounded border">
          <div className="flex items-center">
            {allowComments ? (
              <MessageCircle size={16} className="mr-2 text-blue-600" />
            ) : (
              <MessageCircleOff size={16} className="mr-2 text-gray-600" />
            )}
            <span className="text-sm">댓글 허용</span>
          </div>
          <input
            type="checkbox"
            checked={allowComments}
            onChange={(e) => setAllowComments(e.target.checked)}
            className="toggle"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-white rounded border">
          <div className="flex items-center">
            {hideViews ? (
              <EyeOff size={16} className="mr-2 text-gray-600" />
            ) : (
              <Eye size={16} className="mr-2 text-blue-600" />
            )}
            <span className="text-sm">조회수 공개</span>
          </div>
          <input
            type="checkbox"
            checked={!hideViews}
            onChange={(e) => setHideViews(!e.target.checked)}
            className="toggle"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-white rounded border">
          <div className="flex items-center">
            {hideLikes ? (
              <HeartOff size={16} className="mr-2 text-gray-600" />
            ) : (
              <Heart size={16} className="mr-2 text-red-600" />
            )}
            <span className="text-sm">좋아요 공개</span>
          </div>
          <input
            type="checkbox"
            checked={!hideLikes}
            onChange={(e) => setHideLikes(!e.target.checked)}
            className="toggle"
          />
        </label>
      </div>
    </div>
  );
}
