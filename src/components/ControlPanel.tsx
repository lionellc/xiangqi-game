import { useEffect, useState } from "react";
import { useXiangqiStore } from "../store/useXiangqiStore";

export const ControlPanel = () => {
  const {
    savedGames,
    currentGameId,
    newGame,
    restoreGame,
    copyRecord,
    renameGame,
    undoMove,
    addComment,
    saveComment,
    markBranchPoint,
    deleteBranchPoint,
    markUnderline,
    branchFromHere,
    playAllFragments,
    stopPlay,
    setGameName,
  } = useXiangqiStore();

  const currentGameName =
    savedGames.find((game) => game.id === currentGameId)?.name || "未命名棋局";
  const [nameText, setNameText] = useState(currentGameName);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    setNameText(currentGameName);
  }, [currentGameName]);

  return (
    <div className="control-panel">
      <input
        type="text"
        className="game-name-input"
        placeholder="棋局名称"
        value={nameText}
        onChange={(e) => {
          setNameText(e.target.value);
          setGameName(e.target.value);
        }}
      />

      <button className="btn btn-secondary" onClick={restoreGame}>
        恢复棋局
      </button>
      <button className="btn btn-secondary" onClick={copyRecord}>
        复制棋谱
      </button>
      <button className="btn btn-warning" onClick={newGame}>
        新局
      </button>
      <button
        className="btn btn-secondary"
        onClick={() => renameGame(window.prompt("请输入棋局名称") || "")}
      >
        棋局更名
      </button>
      <button className="btn btn-secondary" onClick={undoMove}>
        悔棋
      </button>
      <button className="btn btn-secondary" onClick={() => addComment(commentText)}>
        注释
      </button>

      <button className="btn mark-branch-btn" onClick={markBranchPoint}>
        标记为分支点
      </button>
      <button className="btn btn-danger" onClick={deleteBranchPoint}>
        删除分支点
      </button>
      <button className="btn mark-underline-btn" onClick={markUnderline}>
        添加下划线
      </button>

      <button className="btn btn-warning" onClick={branchFromHere}>
        从此变着
      </button>

      <button className="btn play-control-btn" onClick={playAllFragments}>
        播放所有片段
      </button>
      <button className="btn btn-secondary" onClick={stopPlay}>
        停止播放
      </button>

      <div className="comment-area">
        <div style={{ marginBottom: 2 }}>棋谱注释</div>
        <textarea
          className="comment-input"
          placeholder="输入注释..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button
          className="btn btn-secondary"
          style={{ marginTop: 2, width: "100%", padding: 3, fontSize: 11 }}
          onClick={() => saveComment(commentText)}
        >
          保存注释
        </button>
        <div className="comment-display" id="commentDisplay"></div>
      </div>
    </div>
  );
};
