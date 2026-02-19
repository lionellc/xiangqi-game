// 基础配置 - 棋盘尺寸
        const BOARD_WIDTH = 402;
        const BOARD_HEIGHT = 452;
        const GRID_WIDTH = BOARD_WIDTH / 9;
        const GRID_HEIGHT = BOARD_HEIGHT / 10;
        const GRID_SIZE = Math.min(GRID_WIDTH, GRID_HEIGHT);
        
        const COLS = 9;
        const ROWS = 10;
        const COL_NAMES_RED = ['九','八','七','六','五','四','三','二','一'];
        const COL_NAMES_BLACK = ['1','2','3','4','5','6','7','8','9'];
        const NUM_TO_CHINESE = ['','一','二','三','四','五','六','七','八','九'];

        // 游戏状态
        let gameMode = 'play';
        let currentTurn = 'red';
        let selectedPiece = null;
        let selectedSetupPiece = null;
        let gameOver = false;
        let isBoardFlipped = false;
        
        // 棋谱数据
        let currentLine = [];
        let savedFragments = [];
        let selectedMoveIndex = -1;
        let comments = {};
        let branchPoints = {}; // 分支点标记（只是标记，没有功能）
        
        // 片段编辑相关
        let selectedFragmentIndex = -1;
        let selectedFragmentMoveIndex = -1;
        
        // 显示模式
        let viewMode = 'current';
        
        // 时钟相关
        let clockRule = 'suddenDeath';
        let redBaseTime = 1200;
        let blackBaseTime = 1200;
        let redStepTime = 60;
        let blackStepTime = 60;
        let incrementTime = 5;
        
        let redTime = redBaseTime;
        let blackTime = blackBaseTime;
        let redStepTimeRemaining = redStepTime;
        let blackStepTimeRemaining = blackStepTime;
        
        let clockRunning = false;
        let currentClock = null;
        let clockInterval = null;

        // 文件管理相关
        let currentFileHandle = null;
        let currentFileName = '未命名棋谱书.json';
        let isFileModified = false;

        // 棋局管理
        let savedGames = [];
        let currentGameId = 0;
        let deletedGames = [];

        // 播放相关变量
        let isPlaying = false;
        let playTimer = null;
        let currentPlayFragmentIndex = 0;
        let currentPlayStepIndex = 0;
        let playSpeed = 2000; // 默认正常速度2秒
        let playFragmentList = []; // 要播放的片段列表
        let voiceEnabled = true; // 语音朗读开关
        // 棋子类型
        const pieceTypes = [
            {type:'帅', color:'red'}, {type:'车', color:'red'}, {type:'马', color:'red'},
            {type:'相', color:'red'}, {type:'士', color:'red'}, {type:'炮', color:'red'},
            {type:'兵', color:'red'}, {type:'将', color:'black'}, {type:'车', color:'black'},
            {type:'马', color:'black'}, {type:'象', color:'black'}, {type:'士', color:'black'},
            {type:'炮', color:'black'}, {type:'卒', color:'black'}
        ];

        // 默认布局
        const defaultLayout = [
            {type:'车',color:'red',row:9,col:0}, {type:'马',color:'red',row:9,col:1},
            {type:'相',color:'red',row:9,col:2}, {type:'士',color:'red',row:9,col:3},
            {type:'帅',color:'red',row:9,col:4}, {type:'士',color:'red',row:9,col:5},
            {type:'相',color:'red',row:9,col:6}, {type:'马',color:'red',row:9,col:7},
            {type:'车',color:'red',row:9,col:8}, {type:'炮',color:'red',row:7,col:1},
            {type:'炮',color:'red',row:7,col:7}, {type:'兵',color:'red',row:6,col:0},
            {type:'兵',color:'red',row:6,col:2}, {type:'兵',color:'red',row:6,col:4},
            {type:'兵',color:'red',row:6,col:6}, {type:'兵',color:'red',row:6,col:8},
            {type:'车',color:'black',row:0,col:0}, {type:'马',color:'black',row:0,col:1},
            {type:'象',color:'black',row:0,col:2}, {type:'士',color:'black',row:0,col:3},
            {type:'将',color:'black',row:0,col:4}, {type:'士',color:'black',row:0,col:5},
            {type:'象',color:'black',row:0,col:6}, {type:'马',color:'black',row:0,col:7},
            {type:'车',color:'black',row:0,col:8}, {type:'炮',color:'black',row:2,col:1},
            {type:'炮',color:'black',row:2,col:7}, {type:'卒',color:'black',row:3,col:0},
            {type:'卒',color:'black',row:3,col:2}, {type:'卒',color:'black',row:3,col:4},
            {type:'卒',color:'black',row:3,col:6}, {type:'卒',color:'black',row:3,col:8}
        ];
