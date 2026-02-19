import { useXiangqiStore } from "../store/useXiangqiStore";

export const GameManagementBar = () => {
  const { savedGames, currentGameId, loadGame, prevGame, nextGame, moveGameUp, moveGameDown, deleteGame } =
    useXiangqiStore();

  return (
    <div className="game-management">
      <select
        id="gameSelect"
        value={currentGameId || ""}
        onChange={(e) => {
          const nextId = Number(e.target.value);
          if (nextId) loadGame(nextId);
        }}
      >
        <option value="">选择棋局</option>
        {savedGames.map((game) => (
          <option key={game.id} value={game.id}>
            {game.name}
          </option>
        ))}
      </select>
      <div className="game-management-buttons">
        <button className="btn btn-secondary small-btn" onClick={prevGame}>
          上一局
        </button>
        <button className="btn btn-secondary small-btn" onClick={nextGame}>
          下一局
        </button>
        <button className="btn btn-secondary small-btn" onClick={moveGameUp}>
          前移
        </button>
        <button className="btn btn-secondary small-btn" onClick={moveGameDown}>
          后移
        </button>
        <button className="btn btn-danger small-btn" onClick={deleteGame}>
          删除
        </button>
      </div>
    </div>
  );
};
