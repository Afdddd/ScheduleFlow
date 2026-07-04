import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjectList, ProjectListResponse } from '../api/list';
import { uploadFile } from '../api/file';

/**
 * MobilePhotosPage — 현장 사진·영상 올리기 흐름 (`/photos`).
 *
 * 흐름: 현장 선택 → 폰 기본 카메라/앨범(<input capture>) → 확인 → 업로드 → 완료.
 * 컨셉: 카톡 대체가 아니라 "안 틀리고 나중에 찾기". 현장=프로젝트로 매핑,
 * 업로드는 `uploadFile(projectId, file, 'PHOTO')`.
 *
 * NOTE: 카테고리 'PHOTO'는 백엔드에 사진 카테고리가 있다는 가정. 없으면
 * 프로젝트 파일 카테고리 enum에 추가 필요(그때까지 업로드 시 에러 안내).
 */

const DEFAULT_COLOR = '#0B4EC4';

type Step = 'site' | 'review' | 'uploading' | 'done';
interface Picked {
  file: File;
  url: string;
  isVideo: boolean;
}

const MobilePhotosPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('site');
  const [projects, setProjects] = useState<ProjectListResponse[]>([]);
  const [site, setSite] = useState<ProjectListResponse | null>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [memo, setMemo] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const camRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProjectList('', 0, 100);
        setProjects(res.content);
      } catch (e) {
        console.error('현장(프로젝트) 로딩 실패:', e);
      }
    })();
  }, []);

  // object URL 정리
  useEffect(() => () => picked.forEach((p) => URL.revokeObjectURL(p.url)), [picked]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    const next = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video'),
    }));
    setPicked((prev) => [...prev, ...next]);
    setStep('review');
  };

  const removeAt = (i: number) =>
    setPicked((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });

  const submit = async () => {
    if (!site || picked.length === 0) return;
    setError(null);
    setStep('uploading');
    setProgress(0);
    try {
      for (let i = 0; i < picked.length; i++) {
        await uploadFile(site.id, picked[i].file, 'PHOTO');
        setProgress(Math.round(((i + 1) / picked.length) * 100));
      }
      setStep('done');
    } catch (e) {
      console.error('사진 업로드 실패:', e);
      setError('업로드에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setStep('review');
    }
  };

  const siteColor = site?.colorCode ?? DEFAULT_COLOR;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* 숨은 파일 입력 (폰 기본 카메라 / 앨범) */}
      <input ref={camRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={onPick} />
      <input ref={albumRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={onPick} />

      {/* 헤더 */}
      <div className="flex items-center gap-1 px-2.5 pb-3 pt-3">
        <button
          onClick={() => (step === 'site' ? navigate('/') : setStep('site'))}
          aria-label="뒤로"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 active:bg-gray-100"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-[17px] font-extrabold tracking-tight text-gray-900">
          {step === 'done' ? '현장 사진첩' : step === 'review' ? '사진·영상 확인' : '사진 올리기'}
        </h1>
        <span className="w-10" />
      </div>

      {/* STEP: 현장 선택 */}
      {step === 'site' && (
        <div className="px-[18px] pb-24 pt-2">
          <h2 className="text-[22px] font-extrabold tracking-tight text-gray-900">어느 현장이에요?</h2>
          <p className="mt-1.5 text-[14px] font-semibold text-gray-500">올릴 현장을 하나 눌러주세요.</p>

          <div className="mt-5 flex flex-col gap-3">
            {projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm font-semibold text-gray-400">
                현장(프로젝트)이 없어요
              </div>
            ) : (
              projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSite(p);
                    // 현장 고르면 바로 폰 기본 카메라를 연다
                    camRef.current?.click();
                  }}
                  className="flex items-center gap-3.5 rounded-2xl border-2 border-gray-200 bg-white px-4 py-[17px] text-left transition-transform active:scale-[0.99]"
                >
                  <span className="h-3.5 w-3.5 flex-none rounded-[5px]" style={{ backgroundColor: p.colorCode ?? DEFAULT_COLOR }} />
                  <span className="flex-1 truncate text-[17px] font-bold text-gray-900">{p.name}</span>
                  <svg className="h-5 w-5 flex-none text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ))
            )}
          </div>

          {site && (
            <button
              onClick={() => albumRef.current?.click()}
              className="mt-3 w-full py-3 text-center text-[15px] font-bold text-gray-500"
            >
              앨범에서 여러 장 고르기
            </button>
          )}
        </div>
      )}

      {/* STEP: 확인 */}
      {step === 'review' && (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 px-[18px] pb-4">
            {/* 올라갈 현장 배너 */}
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-green-50 text-green-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-gray-400">여기에 올라갑니다</div>
                <div className="truncate text-[16px] font-extrabold text-gray-900">{site?.name}</div>
              </div>
              <button onClick={() => setStep('site')} className="flex-none text-[14px] font-bold text-primary-600">
                변경
              </button>
            </div>

            {/* 썸네일 그리드 */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {picked.map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-gray-200">
                  {p.isVideo ? (
                    <video src={p.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  )}
                  {p.isVideo && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      동영상
                    </span>
                  )}
                  <button
                    onClick={() => removeAt(i)}
                    aria-label="삭제"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => camRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-white text-[12px] font-bold text-gray-400"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                추가
              </button>
            </div>

            {/* 메모 */}
            <div className="mt-4 text-[13px] font-bold text-gray-400">
              한 줄 메모 <span className="font-semibold text-gray-400">(안 써도 돼요)</span>
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="예: 외벽 균열 부분"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white p-3.5 text-[15px] text-gray-900 outline-none focus:border-primary-500"
            />

            {error && <p className="mt-3 text-[14px] font-semibold text-red-500">{error}</p>}
          </div>

          {/* 제출 */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <button
              onClick={submit}
              disabled={picked.length === 0}
              className="w-full rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 py-[18px] text-[18px] font-extrabold text-white shadow-lg shadow-primary-500/30 transition-transform active:scale-[0.99] disabled:opacity-50"
            >
              {picked.length}개 올리기
            </button>
          </div>
        </div>
      )}

      {/* STEP: 업로드 중 */}
      {step === 'uploading' && (
        <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
          <svg className="h-24 w-24 animate-spin" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#e6e9f1" strokeWidth="5" />
            <circle cx="25" cy="25" r="20" fill="none" stroke="#0B4EC4" strokeWidth="5" strokeLinecap="round" strokeDasharray="90 40" />
          </svg>
          <h3 className="mt-6 text-[19px] font-extrabold text-gray-900">올리는 중…</h3>
          <p className="mt-1.5 text-[14px] font-semibold text-gray-500">{site?.name} 현장</p>
          <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* STEP: 완료 */}
      {step === 'done' && (
        <div className="flex flex-1 flex-col px-[18px] pb-10">
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-700">
            <svg className="h-6 w-6 flex-none" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span className="text-[15px] font-bold">{picked.length}장 올렸어요 · 팀원에게 공유됨</span>
          </div>

          <div className="mt-5 flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-[5px]" style={{ backgroundColor: siteColor }} />
            <span className="text-[21px] font-extrabold tracking-tight text-gray-900">{site?.name}</span>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-gray-400">항상 여기서 찾을 수 있어요</p>

          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {picked.map((p, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-gray-200">
                {p.isVideo ? (
                  <video src={p.url} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-1 top-1 rounded bg-green-600 px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
                  NEW
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2.5 pt-6">
            {site && (
              <button
                onClick={() => navigate(`/projects/${site.id}`)}
                className="w-full rounded-2xl border border-gray-200 bg-white py-4 text-[16px] font-bold text-gray-800 shadow-sm"
              >
                현장 상세 보기
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 py-4 text-[16px] font-extrabold text-white shadow-lg shadow-primary-500/30"
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePhotosPage;
