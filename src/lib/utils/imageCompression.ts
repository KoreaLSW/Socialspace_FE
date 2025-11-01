/**
 * 이미지 압축 유틸리티
 * 5MB를 초과하는 이미지를 자동으로 리사이징 및 압축하여 업로드 가능한 크기로 변환
 */

export interface CompressionOptions {
  maxSizeMB?: number; // 최대 파일 크기 (MB, 기본값: 5)
  maxWidth?: number; // 최대 너비 (기본값: 1920)
  maxHeight?: number; // 최대 높이 (기본값: 1920)
  quality?: number; // 초기 품질 (0.0 ~ 1.0, 기본값: 0.9)
  minQuality?: number; // 최소 품질 (0.0 ~ 1.0, 기본값: 0.6)
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxSizeMB: 5,
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.9,
  minQuality: 0.6,
};

/**
 * 파일 크기를 MB 단위로 반환
 */
function getFileSizeMB(blob: Blob): number {
  return blob.size / (1024 * 1024);
}

/**
 * 이미지 리사이징 및 압축
 * @param file 원본 이미지 파일
 * @param options 압축 옵션
 * @returns 압축된 File 객체 또는 원본 File (이미 5MB 이하인 경우)
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxSizeBytes = opts.maxSizeMB * 1024 * 1024;

  // 이미 5MB 이하면 그대로 반환
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const img = new Image();

        img.onload = async () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Canvas context를 가져올 수 없습니다."));
              return;
            }

            // 원본 이미지 크기
            let width = img.width;
            let height = img.height;

            // 최대 크기에 맞춰 리사이징
            if (width > opts.maxWidth || height > opts.maxHeight) {
              const ratio = Math.min(
                opts.maxWidth / width,
                opts.maxHeight / height
              );
              width = width * ratio;
              height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;

            // 이미지 그리기
            ctx.drawImage(img, 0, 0, width, height);

            // 이미지 포맷 결정
            const mimeType = file.type || "image/jpeg";
            const imageFormat =
              mimeType === "image/png" ? "image/png" : "image/jpeg";

            // 품질을 조절하며 5MB 이하로 압축 (이진 탐색)
            const compressWithQuality = (
              targetQuality: number
            ): Promise<Blob> => {
              return new Promise((resolveBlob, rejectBlob) => {
                canvas.toBlob(
                  (blob) => {
                    if (!blob) {
                      rejectBlob(new Error("이미지 압축에 실패했습니다."));
                      return;
                    }
                    resolveBlob(blob);
                  },
                  imageFormat,
                  targetQuality
                );
              });
            };

            // 이진 탐색으로 적절한 품질 찾기
            let lowQuality = opts.minQuality;
            let highQuality = opts.quality;
            let bestBlob: Blob | null = null;
            const maxAttempts = 10;

            for (let i = 0; i < maxAttempts; i++) {
              const testQuality = (lowQuality + highQuality) / 2;
              const testBlob = await compressWithQuality(testQuality);

              if (testBlob.size <= maxSizeBytes) {
                bestBlob = testBlob;
                // 더 높은 품질 시도
                lowQuality = testQuality;
              } else {
                // 더 낮은 품질 필요
                highQuality = testQuality;
              }

              // 충분히 가까워지면 종료
              if (highQuality - lowQuality < 0.05) {
                break;
              }
            }

            if (bestBlob) {
              const compressedFile = new File([bestBlob], file.name, {
                type: bestBlob.type,
              });
              resolve(compressedFile);
            } else {
              // 최소 품질로라도 압축
              const minBlob = await compressWithQuality(opts.minQuality);
              const compressedFile = new File([minBlob], file.name, {
                type: minBlob.type,
              });
              resolve(compressedFile);
            }
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error("이미지를 로드할 수 없습니다."));
        };

        img.src = e.target?.result as string;
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽을 수 없습니다."));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 여러 이미지를 동시에 압축
 * @param files 이미지 파일 배열
 * @param options 압축 옵션
 * @returns 압축된 File 배열
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressedFiles = await Promise.all(
    files.map((file) => compressImage(file, options))
  );
  return compressedFiles;
}

/**
 * 이미지 파일 크기를 읽기 쉬운 형식으로 변환
 * @param bytes 바이트 크기
 * @returns 포맷된 문자열 (예: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
