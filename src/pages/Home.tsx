import { Toolbar } from '../components/Toolbar';
import { CueList } from '../components/CueList';
import { Timeline } from '../components/Timeline';
import { RulePanel } from '../components/RulePanel';
import { Preview } from '../components/Preview';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-6">
        <div className="mb-6">
          <Toolbar />
        </div>

        <div className="mb-6">
          <Timeline />
        </div>

        <div className="grid grid-cols-12 gap-6" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <div className="col-span-4 bg-zinc-900/40 backdrop-blur-sm rounded-xl border border-zinc-800 p-5 overflow-hidden">
            <CueList />
          </div>

          <div className="col-span-5 space-y-6 overflow-hidden">
            <div className="h-full flex flex-col">
              <Preview />
            </div>
          </div>

          <div className="col-span-3 overflow-hidden">
            <RulePanel />
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-zinc-600">
          拖拽排序 · 点击编辑 · 实时校验规则
        </div>
      </div>
    </div>
  );
}
