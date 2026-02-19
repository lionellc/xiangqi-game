import "./styles/app.css";
import { useXiangqiStore } from "./store/useXiangqiStore";
import { FileManagementBar } from "./components/FileManagementBar";
import { GameManagementBar } from "./components/GameManagementBar";
import { BoardCanvas } from "./components/BoardCanvas";
import { ClockPanel } from "./components/ClockPanel";
import { SetupPanel } from "./components/SetupPanel";
import { RecordPanel } from "./components/RecordPanel";
import { ControlPanel } from "./components/ControlPanel";

function App() {
  const { flipBoard, mirrorRecord } = useXiangqiStore();

  return (
    <div>
      <div className="header">
        <h1>中国象棋棋谱编辑器</h1>
      </div>
      <FileManagementBar />
      <GameManagementBar />
      <div className="main-container">
        <div className="left-panel">
          <ClockPanel />
          <SetupPanel />
        </div>
        <div className="board-area">
          <BoardCanvas />
          <div className="board-bottom-controls">
            <button className="btn btn-info small-btn" id="flipBoardBtn" onClick={flipBoard}>
              翻转棋盘
            </button>
            <button className="btn btn-info small-btn" id="mirrorRecordBtn" onClick={mirrorRecord}>
              棋谱镜像
            </button>
          </div>
        </div>
        <div className="right-panel">
          <RecordPanel />
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
