//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

class Player extends egret.DisplayObjectContainer {    //角色
    _main: Main;
    _label: egret.TextField;
    _stateMachine: StateMachine;
    _body: egret.Bitmap;
    _ifstand: boolean;
    _ifwalk: boolean;


    constructor(_main: Main) {
        super();
        this._main = _main;
        this._body = new egret.Bitmap;
        this._body.texture = RES.getRes("stand1_jpg");
        this._main.addChild(this._body);
        this._body.anchorOffsetX = 150;
        this._body.anchorOffsetY = 150;
        this._stateMachine = new StateMachine();
        this._body.x = this._main.stage.stageWidth / 2;
        this._body.y = this._main.stage.stageHeight / 2;
        this._ifstand = true;
        this._ifwalk = false;

    }
    public move(targetX: number, targetY: number) {
         egret.Tween.removeTweens(this._body);     //翻转图像
        if (targetX < this._body.x) {
            this._body.skewY = 180;
        }
        else { this._body.skewY = 0; }
        this._stateMachine.setState(new PlayerMoveState(this));

        egret.Tween.get(this._body).to({ x: targetX, y: targetY }, 2000).call( function(){this.idle()} ,this);
      
    }

    public idle() {

        this._stateMachine.setState(new PlayerIdleState(this));
    }


    public startWalk() {
        var list = ["walk1_jpg", "walk2_jpg", "walk3_jpg", "walk4_jpg"];
        var count = -1;
        egret.Ticker.getInstance().register(() => {
            count = count + 0.2;
            if (count >= list.length) {
                count = 0;
            }
            this._body.texture = RES.getRes(list[Math.floor(count)]);


        }, this);
        


    }

    public startidle() {

        var list = ["stand1_jpg", "stand2_jpg", "stand3_jpg", "stand4_jpg"];
        var count = -1;
        egret.Ticker.getInstance().register(() => {
            count = count + 0.2;
            if (count >= list.length) {
                count = 0;
            }

            this._body.texture = RES.getRes(list[Math.floor(count)]);

        }, this);



    }

}

class PlayerState implements State {

    _player: Player;

    constructor(player: Player) {
        this._player = player;

    }

    onEnter() { }
    onExit() { }

}

interface State {
    onEnter();
    onExit();
}

class PlayerMoveState extends PlayerState {

    onEnter() {

        this._player._ifwalk = true;
  
        this._player.startWalk();
      
    }
    onExit() {
        this._player._ifwalk = false;
    }


}

class PlayerIdleState extends PlayerState {

    onEnter() {
        
         this._player._ifstand = true;
         this._player.startidle();

    }
    onExit() {
        this._player._ifstand= false;
    }


}

class StateMachine {
    CurrentState: State;

    setState(e: State) {

        if (this.CurrentState != null) {
            this.CurrentState.onExit();
        }
        this.CurrentState = e;
        e.onEnter();
    }

}



class Main extends egret.DisplayObjectContainer {

    /**
     * 加载进度界面
     * Process interface loading
     */
    private loadingView: LoadingUI;

    private _txInfo: egret.TextField;

    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
        this.once(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);

    }

    private onAddToStage(event: egret.Event) {
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);

        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    }

    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    private onConfigComplete(event: RES.ResourceEvent): void {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    }

    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    private onResourceLoadComplete(event: RES.ResourceEvent): void {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onItemLoadError(event: RES.ResourceEvent): void {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onResourceLoadError(event: RES.ResourceEvent): void {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    }

    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    private onResourceProgress(event: RES.ResourceEvent): void {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    }

    private textfield: egret.TextField;

    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameScene(): void {

        var sky: egret.Bitmap = this.createBitmapByName("black_jpg");
        this.addChild(sky);
        var stageW: number = this.stage.stageWidth;
        var stageH: number = this.stage.stageHeight;
        sky.alpha = 1;
        sky.width = stageW;
        sky.height = stageH;


       

       
        var player: Player = new Player(this);
        player.idle();

        this.stage.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt: egret.TouchEvent) => {

            player.move(evt.stageX, evt.stageY);

        }, this);




    }





    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    private createBitmapByName(name: string): egret.Bitmap {
        var result = new egret.Bitmap();
        var texture: egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }


    /**
     * 切换描述内容
     * Switch to described content
     */
    private changeDescription(textfield: egret.TextField, textFlow: Array<egret.ITextElement>): void {
        textfield.textFlow = textFlow;
    }

    protected load(callback: Function): void {
        var count: number = 0;
        var self = this;

        var check = function () {
            count++;
            if (count == 2) {
                callback.call(self);
            }
        }

        var loader = new egret.URLLoader();
        loader.addEventListener(egret.Event.COMPLETE, function loadOver(e) {
            var loader = e.currentTarget;

            this._mcData = JSON.parse(loader.data);

            check();
        }, this);
        loader.dataFormat = egret.URLLoaderDataFormat.TEXT;
        var request = new egret.URLRequest("resource/assets/mc/animation.json");
        loader.load(request);
    }

}


