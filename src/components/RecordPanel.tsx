import { useXiangqiStore } from "../store/useXiangqiStore";
import { formatMoveText } from "../lib/recordFormat";

export const RecordPanel = () => {
  const {
    viewMode,
    switchViewMode,
    currentLine,
    savedFragments,
    selectedMoveIndex,
    selectedFragmentIndex,
    selectedFragmentMoveIndex,
    comments,
    selectMoveIndex,
    toggleFragmentEdit,
    selectFragmentMove,
    viewFragmentMove,
    playCurrentFragment,
  } = useXiangqiStore();

  const currentMoveInfo =
    viewMode === "current" && selectedMoveIndex >= 0
      ? `第${selectedMoveIndex + 1}着`
      : "第0着";

  const statusInfo = `显示模式：${viewMode === "current" ? "当前线路" : "片段集合"} | 当前线路：${
    currentLine.length
  }步 | 已保存片段：${savedFragments.length}个`;

  return (
    <div className="record-panel">
      <div className="record-header">
        <div className="record-title">棋谱记录</div>
        <div id="currentMoveInfo">{currentMoveInfo}</div>
      </div>
      <div className="view-mode">
        <button
          className="btn btn-secondary"
          id="viewCurrentBtn"
          style={{ fontSize: 10, padding: 2 }}
          onClick={() => switchViewMode("current")}
        >
          当前线路
        </button>
        <button
          className="btn btn-secondary"
          id="viewFragmentsBtn"
          style={{ fontSize: 10, padding: 2 }}
          onClick={() => switchViewMode("fragments")}
        >
          片段集合
        </button>
        <button
          className="btn play-control-btn"
          id="playBtn"
          style={{ fontSize: 10, padding: 2 }}
          onClick={playCurrentFragment}
        >
          播放当前片段
        </button>
      </div>
      <div className="record-area" id="recordArea">
        {viewMode === "current" && currentLine.length === 0 && "请开始对弈"}
        {viewMode === "current" &&
          currentLine.map((move, index) => (
            <span
              key={`${move.move}-${index}`}
              className={`record-line ${selectedMoveIndex === index ? "active" : ""}`}
              onClick={() => selectMoveIndex(index)}
            >
              {formatMoveText(move, index, comments[index])}
            </span>
          ))}
        {viewMode === "fragments" &&
          savedFragments.map((fragment, fragmentIndex) => (
            <div key={`${fragment.title}-${fragmentIndex}`}>
              <div className="fragment-title" onClick={() => toggleFragmentEdit(fragmentIndex)}>
                {fragment.title}
              </div>
              {fragment.moves.map((move, moveIndex) => {
                const isSelected =
                  selectedFragmentIndex === fragmentIndex && selectedFragmentMoveIndex === moveIndex;
                const isEditable = !!fragment.editable;
                const className = `record-line ${
                  isSelected ? (isEditable ? "editable-selected" : "active") : ""
                }`;
                return (
                  <span
                    key={`${fragmentIndex}-${moveIndex}`}
                    className={className}
                    onClick={() =>
                      isEditable
                        ? selectFragmentMove(fragmentIndex, moveIndex)
                        : viewFragmentMove(fragmentIndex, moveIndex)
                    }
                  >
                    {formatMoveText(
                      move,
                      moveIndex,
                      fragment.comments?.[moveIndex],
                      fragment.underlineMarks?.[moveIndex],
                    )}
                  </span>
                );
              })}
            </div>
          ))}
      </div>
      <div className="status-info" id="gameStatusInfo">
        {statusInfo}
      </div>
    </div>
  );
};
