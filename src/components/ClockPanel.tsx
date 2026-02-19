import { useXiangqiStore } from "../store/useXiangqiStore";
import { formatSeconds, clampMinutes } from "../lib/clockFormat";

export const ClockPanel = () => {
  const {
    clockRule,
    redTime,
    blackTime,
    redStepTimeRemaining,
    blackStepTimeRemaining,
    redBaseTime,
    blackBaseTime,
    redStepTime,
    blackStepTime,
    incrementTime,
    startClock,
    pauseClock,
    resetClock,
    selectRule,
    updateClockSetting,
    toggleSetupMode,
    voiceEnabled,
    toggleVoice,
  } = useXiangqiStore();

  const redBaseMinutes = Math.floor(redBaseTime / 60);
  const blackBaseMinutes = Math.floor(blackBaseTime / 60);

  return (
    <div className="clock-container">
      <div className="clock-title">象棋时钟</div>
      <div className="clock-display">
        <div className="clock-player">
          <div className="clock-player-label">红方</div>
          <div className="clock-time red" id="redClock">
            {formatSeconds(redTime)}
          </div>
          <div className="step-time-display" id="redStepTime">
            {clockRule === "stepTime" ? `步时: ${formatSeconds(redStepTimeRemaining)}` : null}
          </div>
        </div>
        <div className="clock-player">
          <div className="clock-player-label">黑方</div>
          <div className="clock-time black" id="blackClock">
            {formatSeconds(blackTime)}
          </div>
          <div className="step-time-display" id="blackStepTime">
            {clockRule === "stepTime" ? `步时: ${formatSeconds(blackStepTimeRemaining)}` : null}
          </div>
        </div>
      </div>

      <div className="clock-rule-selector">
        <div
          className={`rule-option ${clockRule === "suddenDeath" ? "selected" : ""}`}
          onClick={() => selectRule("suddenDeath")}
        >
          <input type="radio" checked={clockRule === "suddenDeath"} readOnly /> 包干制
        </div>
        <div
          className={`rule-option ${clockRule === "increment" ? "selected" : ""}`}
          onClick={() => selectRule("increment")}
        >
          <input type="radio" checked={clockRule === "increment"} readOnly /> 加秒制
        </div>
        <div
          className={`rule-option ${clockRule === "stepTime" ? "selected" : ""}`}
          onClick={() => selectRule("stepTime")}
        >
          <input type="radio" checked={clockRule === "stepTime"} readOnly /> 步时制
        </div>
      </div>

      <div className="clock-setter" id="clockSettings">
        <div className="clock-setter-group">
          <label>红方时间(分):</label>
          <input
            type="number"
            value={redBaseMinutes}
            min={1}
            max={180}
            onChange={(e) =>
              updateClockSetting({ redBaseTime: clampMinutes(Number(e.target.value)) * 60 })
            }
          />
        </div>
        <div className="clock-setter-group">
          <label>黑方时间(分):</label>
          <input
            type="number"
            value={blackBaseMinutes}
            min={1}
            max={180}
            onChange={(e) =>
              updateClockSetting({ blackBaseTime: clampMinutes(Number(e.target.value)) * 60 })
            }
          />
        </div>
        {clockRule === "increment" && (
          <div className="clock-setter-group">
            <label>每步加时(秒):</label>
            <input
              type="number"
              value={incrementTime}
              min={0}
              max={60}
              onChange={(e) => updateClockSetting({ incrementTime: Number(e.target.value) })}
            />
          </div>
        )}
        {clockRule === "stepTime" && (
          <>
            <div className="clock-setter-group">
              <label>红方步时(秒):</label>
              <input
                type="number"
                value={redStepTime}
                min={5}
                max={300}
                onChange={(e) => updateClockSetting({ redStepTime: Number(e.target.value) })}
              />
            </div>
            <div className="clock-setter-group">
              <label>黑方步时(秒):</label>
              <input
                type="number"
                value={blackStepTime}
                min={5}
                max={300}
                onChange={(e) => updateClockSetting({ blackStepTime: Number(e.target.value) })}
              />
            </div>
          </>
        )}
      </div>

      <div className="clock-control-buttons">
        <button className="btn btn-success" onClick={() => startClock("red")}>
          开始
        </button>
        <button className="btn btn-secondary" onClick={pauseClock}>
          暂停
        </button>
        <button className="btn btn-danger" onClick={resetClock}>
          重置
        </button>
      </div>

      <div className="voice-control">
        <label>
          <input type="checkbox" checked={voiceEnabled} onChange={toggleVoice} /> 语音朗读
        </label>
      </div>

      <button
        className="btn btn-secondary"
        id="toggleSetupModeBtn"
        style={{ marginTop: 6, padding: 4, fontSize: 11 }}
        onClick={toggleSetupMode}
      >
        进入摆棋
      </button>
    </div>
  );
};
