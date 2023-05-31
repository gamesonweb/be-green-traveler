import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
    Engine,
    Scene,
    UniversalCamera,
    Vector3,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    StandardMaterial,
    Color4,
    Sound,
    Vector2,
    Color3,
    ArcRotateCamera,
    Texture,
    CubeTexture, SceneLoader,
    AssetsManager, Vector4,AbstractMesh
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, Slider, TextBlock } from "@babylonjs/gui";
import { WaterMaterial } from "@babylonjs/materials";
import { Platform } from "./platform";
import {CameraInput} from "./CameraInput";
import {LoadingTask} from "./LoadingTask";
enum State { START, GAME, CUTSCENE, END, GAMEOVER }

class App {

    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private engine: Engine;

    private state: number = 0;

    private static sfxMult: number = 1;
    private static musicMult: number = 1;

    private dialogAlreadyPast: boolean = false;

    constructor() {
        // initialize babylon scene and engine
        this.canvas = this.createCanvas();
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);

        this.main();
    }

    private createCanvas(): HTMLCanvasElement {

        // create the canvas html element and attach it to the webpage
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);
        return this.canvas;
    }

    private async main(): Promise<void> {
        Engine.audioEngine.setGlobalVolume(0.5);

        //Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i') {
                if (this.scene.debugLayer.isVisible()) this.scene.debugLayer.hide();
                else this.scene.debugLayer.show();
            }
        });

        await this.gameInitialization();
            // run the main render loop
        this.engine.runRenderLoop( () => {
            if (CameraInput.seedsObtained >= 5) {
                CameraInput.seedsObtained = 0;
                document.exitPointerLock();
                this.gameEnd();
            }
            switch (this.state) {
                case State.START:
                    this.scene.render()
                    break;
                case State.GAME:
                    this.scene.render()
                    break;
                case State.CUTSCENE:
                    this.scene.render()
                    break;
                case State.END:
                    this.scene.render()
                    break;
                case State.GAMEOVER:
                    this.scene.render()
                    break;
                default: break;
            }
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        })
    }

    private async gameInitialization() : Promise<void> {

        this.engine.displayLoadingUI();
        this.scene.detachControl();
        let scene = new Scene(this.engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let cameraLaunch = new UniversalCamera("cameraLaunch", new Vector3(0, 0, 0), scene);
        cameraLaunch.setTarget(Vector3.Zero());

        const soundSelection = new Sound("selection", "./assets/sounds/selection.ogg", scene, function() {
        }, {
            volume: 0.55 * App.sfxMult
        });
        const soundConfirmation = new Sound("confirmation", "./assets/sounds/click.ogg", scene, function() {
        }, {
            volume: App.sfxMult
        });
        const mainMenuMusic = new Sound("mainmenu", "./assets/sounds/mainmenu.ogg", scene, function() {
        }, {
            loop: true,
            autoplay: true,
            volume: 0.9 * App.musicMult
        });

        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720; //fit our fullscreen ui to this height

        const title = new TextBlock("title", "Traveler");
        title.resizeToFit = true;
        title.fontFamily = "Pangolin";
        title.fontSize = "84px";
        title.color = "green";
        title.top = "50px";
        title.width = "0.8";
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        guiMenu.addControl(title);

        const startBtn = Button.CreateSimpleButton("start", "Commencer");
        startBtn.width = 0.2;
        startBtn.fontFamily = "Pangolin";
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "150px";
        startBtn.thickness = 0;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(startBtn);

        const optionBtn = Button.CreateSimpleButton("options", "Options");
        optionBtn.width = 0.2;
        optionBtn.fontFamily = "Pangolin";
        optionBtn.height = "40px";
        optionBtn.color = "white";
        optionBtn.top = "200px";
        optionBtn.thickness = 0;
        optionBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(optionBtn);

        startBtn.onPointerEnterObservable.add( () => {
            soundSelection.play();
        });

        optionBtn.onPointerEnterObservable.add( () => {
            soundSelection.play();
        });

        startBtn.onPointerDownObservable.add( () => {
            soundConfirmation.play();
            this.gameItself();
            scene.detachControl();
            mainMenuMusic.stop();
        });

        optionBtn.onPointerDownObservable.add( () => {
            soundConfirmation.play();
            title.top = "-500px";
            startBtn.top = "500px";
            optionBtn.top = "500px";

            let volumeText = new TextBlock("volumeText", "Volume global");
            volumeText.resizeToFit = true;
            volumeText.fontFamily = "Pangolin";
            volumeText.fontSize = "24px";
            volumeText.color = "white";
            volumeText.top = "0px";
            volumeText.left = "-100px"
            volumeText.width = "0.8";
            volumeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(volumeText);

            let volume = new Slider();
            volume.minimum = 0;
            volume.maximum = 1;
            volume.value = Engine.audioEngine.getGlobalVolume();
            volume.height = "20px";
            volume.width = "100px";
            volume.top = "0px";
            volume.left = "80px";
            volume.background = "white";
            volume.borderColor = "grey";
            volume.thumbColor = "grey";
            volume.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(volume);
            volume.onValueChangedObservable.add(function(value) {
                Engine.audioEngine.setGlobalVolume(value);
            });

            let volumeLevel = new TextBlock("volume", Math.round(volume.value * 100) + "");
            volumeLevel.resizeToFit = true;
            volumeLevel.fontFamily = "Pangolin";
            volumeLevel.fontSize = "24px";
            volumeLevel.color = "white";
            volumeLevel.top = "0px";
            volumeLevel.left = "160px"
            volumeLevel.width = "0.8";
            volumeLevel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(volumeLevel);
            volume.onValueChangedObservable.add(function(value) {
               volumeLevel.text = Math.round(value * 100) + "";
            });

            let sfxText = new TextBlock("sfxText", "Effets sonores");
            sfxText.resizeToFit = true;
            sfxText.fontFamily = "Pangolin";
            sfxText.fontSize = "24px";
            sfxText.color = "white";
            sfxText.top = "50px";
            sfxText.left = "-100px"
            sfxText.width = "0.8";
            sfxText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(sfxText);

            let volumeSfx = new Slider();
            volumeSfx.minimum = 0;
            volumeSfx.maximum = 1;
            volumeSfx.value = App.sfxMult;
            volumeSfx.height = "20px";
            volumeSfx.width = "100px";
            volumeSfx.top = "50px";
            volumeSfx.left = "80px";
            volumeSfx.background = "white";
            volumeSfx.borderColor = "grey";
            volumeSfx.thumbColor = "grey";
            volumeSfx.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(volumeSfx);
            volumeSfx.onValueChangedObservable.add(function(value) {
                App.sfxMult = volumeSfx.value;
                soundSelection.setVolume(0.55 * App.sfxMult)
                soundConfirmation.setVolume(App.sfxMult)
            });

            let volumeSfxLevel = new TextBlock("volume", Math.round(App.sfxMult * 100) + "");
            volumeSfxLevel.resizeToFit = true;
            volumeSfxLevel.fontFamily = "Pangolin";
            volumeSfxLevel.fontSize = "24px";
            volumeSfxLevel.color = "white";
            volumeSfxLevel.top = "50px";
            volumeSfxLevel.left = "160px"
            volumeSfxLevel.width = "0.8";
            volumeSfxLevel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(volumeSfxLevel);
            volumeSfx.onValueChangedObservable.add(function(value) {
                volumeSfxLevel.text = Math.round(value * 100) + "";
            });

            let musicText = new TextBlock("musicText", "Musique");
            musicText.resizeToFit = true;
            musicText.fontFamily = "Pangolin";
            musicText.fontSize = "24px";
            musicText.color = "white";
            musicText.top = "100px";
            musicText.left = "-100px"
            musicText.width = "0.8";
            musicText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(musicText);

            let volumeMusic = new Slider();
            volumeMusic.minimum = 0;
            volumeMusic.maximum = 1;
            volumeMusic.value = App.musicMult;
            volumeMusic.height = "20px";
            volumeMusic.width = "100px";
            volumeMusic.top = "100px";
            volumeMusic.left = "80px";
            volumeMusic.background = "white";
            volumeMusic.borderColor = "grey";
            volumeMusic.thumbColor = "grey";
            volumeMusic.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(volumeMusic);
            volumeMusic.onValueChangedObservable.add(function(value) {
                App.musicMult = volumeMusic.value;
                mainMenuMusic.setVolume(0.9 * App.musicMult)
            });

            let volumeMusicLevel = new TextBlock("volume", Math.round(App.musicMult * 100) + "");
            volumeMusicLevel.resizeToFit = true;
            volumeMusicLevel.fontFamily = "Pangolin";
            volumeMusicLevel.fontSize = "24px";
            volumeMusicLevel.color = "white";
            volumeMusicLevel.top = "100px";
            volumeMusicLevel.left = "160px"
            volumeMusicLevel.width = "0.8";
            volumeMusicLevel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(volumeMusicLevel);
            volumeMusic.onValueChangedObservable.add(function(value) {
                volumeMusicLevel.text = Math.round(value * 100) + "";
            });

            const optionReturnBtn = Button.CreateSimpleButton("optionsReturn", "Retour");
            optionReturnBtn.fontFamily = "Pangolin";
            optionReturnBtn.width = 0.2;
            optionReturnBtn.height = "40px";
            optionReturnBtn.color = "white";
            optionReturnBtn.top = "200px";
            optionReturnBtn.thickness = 0;
            optionReturnBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiMenu.addControl(optionReturnBtn);
            optionReturnBtn.onPointerEnterObservable.add( () => {
                soundSelection.play();
            });
            optionReturnBtn.onPointerDownObservable.add(() => {
                soundConfirmation.play();
                this.gameInitialization();
            });

        });

        await LoadingTask.load(scene);

        await scene.whenReadyAsync();
        this.engine.hideLoadingUI();
        this.scene.dispose();
        this.scene = scene;
        this.state = State.START;
    }

    private gameItself() : void {

        this.scene.detachControl();
        let scene = new Scene(this.engine);
        this.scene = scene;
        this.scene.gravity = new Vector3(0, -1.8, 0);
        this.scene.enablePhysics(this.scene.gravity);
        
        const platform = new Platform(this.scene);
        let mainCamera = this.mainCameraSetup();
        mainCamera.fov = 1.2;
        //let mainCamera = new ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 4, 100, Vector3.Zero(), this.scene);
        //mainCamera.position= new Vector3(0,1000,0);

        const gameMusic = new Sound("game", "./assets/sounds/game.ogg", scene, function() {
            gameMusic.play();
        }, {
            loop: true,
            autoplay: true,
            volume: 0.3 * App.musicMult
        });

        //Skybox
        const skyboxMaterial = new StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("./assets/skybox/TropicalSunnyDay", this.scene)
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skyboxMaterial.disableLighting = false;
        const skybox: Mesh = MeshBuilder.CreateBox("skyBox", { size: 10000.0 }, this.scene);
        skybox.material = skyboxMaterial;
        let light1: HemisphericLight = new HemisphericLight("light1", new Vector3(0,1,0), this.scene);

        // Ground
        const ground: Mesh = MeshBuilder.CreateGround("Ground", {width: 10000, height: 10000}, this.scene);
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        ground.position.y = -1000;
        ground.material = this.CreateGroundMaterial();
        ground.checkCollisions = true;

        // Water
        const waterMesh: Mesh = MeshBuilder.CreateGround("waterMesh", {width: 10000, height: 10000}, this.scene);
        const water: WaterMaterial = new WaterMaterial("water", this.scene, new Vector2(512, 512));
        water.backFaceCulling = true;
        water.bumpTexture = new Texture("./assets/textures/waterbump.png", this.scene);

        water.waveHeight = 1.3;
        water.windDirection = new Vector2(1, 1);
        water.waterColor = new Color3(0.1, 0.1, 0.6);
        water.colorBlendFactor = 0.45;
        water.bumpHeight = 0.1;
        water.waveLength = 0.1;
        water.addToRenderList(skybox);
        water.addToRenderList(ground);
        waterMesh.material = water;

        scene.onBeforeRenderObservable.add(() => {
           let cameraPosition = mainCamera.position;
           if (cameraPosition.y < 0) {
               document.exitPointerLock();
               this.gameOver();
           }
        })

        let isLocked: boolean = false;
        this.scene.onPointerDown = (evt): void => {
            if (!isLocked) {
                this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.msRequestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
                if (this.canvas.requestPointerLock) {
                    this.canvas.requestPointerLock();
                }
            }
        };

        //Zone 1
        platform.createBox(100,20,100,-25,10,-25,1);
        platform.createBox(50,100,50,50,50,50,1);
        platform.createBox(50,50,50,50,25,0,1);
        platform.createBox(50,150,50,0,75,50,1);
        platform.createBox(50,200,50,0,100,100,1);
        platform.createBox(50,200,50,-50,100,50,1);
        platform.createBox(50,250,50,-50,125,100,1);
        platform.createBox(50,250,50,-150,125,200,1);
        platform.createBox(50,250,50,-250,125,300,1);
        platform.createBox(100,250,100,-375,125,425,1);

        //Zone 2
        platform.createBox(50,50,50,150,25,-100,2);
        platform.createBox(50,120,50,150,120/2,-150,2);
        platform.createBox(50,120,100,150,120/2,-225,2);
        platform.createBox(50,50,100,150,190,-225,2);
        platform.createBox(150,20,150,150,10,-350,2);
        platform.createBox(50,20,50,175,10,-500,2);
        platform.createBox(50,20,50,125,10,-600,2);
        platform.createBox(50,20,50,175,10,-700,2);
        platform.createBox(50,20,50,125,10,-800,2);
        platform.createBox(50,20,50,175,10,-900,2);
        platform.createBox(50,20,50,125,10,-1000,2);
        platform.createBox(100,20,100,150,10,-1125,2);

        //Zone 3
        platform.createBox(50,50,50,50,25,-325,3);
        platform.createBox(50,100,50,0,50,-375,3);
        platform.createBox(50,150,50,-50,75,-325,3);
        platform.createBox(50,200,50,-100,100,-375,3);
        platform.createBox(50,200,50,-27,100,-147,3);
        platform.createBox(50,200,50,-117,100,-236,3);
        platform.createBox(50,200,50,-248,100,-142,3);
        platform.createBox(50,200,50,-214,100,-253,3);
        platform.createBox(50,200,50,-328,100,-295,3);
        platform.createBox(50,200,50,-330,100,-158,3);
        platform.createBox(50,200,50,-74,100,-624,3);
        platform.createBox(50,200,50,-202,100,-673,3);
        platform.createBox(50,200,50,-307,100,-50,3);
        platform.createBox(50,200,50,-201,100,50,3);
        platform.createBox(50,200,50,-162,100,-152,3);
        platform.createBox(50,200,50,-178,100,-1062,3);
        platform.createBox(50,200,50,-285,100,-755,3);
        platform.createBox(50,200,50,-149,100,-802,3);
        platform.createBox(50,200,50,-301,100,-527,3);
        platform.createBox(50,200,50,-126,100,-654,3);
        platform.createBox(50,200,50,-305,100,-427,3);
        platform.createBox(50,200,50,-83,100,-1057,3);
        platform.createBox(50,200,50,-176,100,-1072,3);
        platform.createBox(50,200,50,-225,100,-90,3);
        platform.createBox(50,200,50,-337,100,-716,3);
        platform.createBox(50,200,50,-211,100,-474,3);
        platform.createBox(50,200,50,-51,100,-460,3);
        platform.createBox(50,200,50,-155,100,-443,3);
        platform.createBox(50,200,50,-305,100,-841,3);
        platform.createBox(50,200,50,-72,100,-926,3);
        platform.createBox(50,200,50,-400,100,-920,3);
        platform.createBox(50,200,50,-282,100,-657,3);
        platform.createBox(50,200,50,-153,100,-317,3);
        platform.createBox(50,200,50,-400,100,-755,3);
        platform.createBox(100,20,100,-500,10,-755,3);

        //Zone 4
        platform.createBox(100,50,100,-500,25,-655,4);
        platform.createBox(100,100,100,-450,50,-655,4);
        platform.createBox(100,150,100,-400,75,-655,4);
        platform.createBox(50,200,50,-350,100,-655,4);
        platform.createBox(50,20,50,250,10,-350,4);
        platform.createBox(50,20,40,300,10,-350,4);
        platform.createBox(50,20,30,350,10,-350,4);
        platform.createBox(50,20,20,400,10,-350,4);
        platform.createBox(50,20,10,450,10,-350,4);
        platform.createBox(10,20,300,470,10,-500,4);
        platform.createBox(200,20,10,565,10,-650,4);
        platform.createBox(10,20,700,660,10,-300,4);
        platform.createBox(200,20,10,765,10,45,4);
        platform.createBox(10,20,700,860,10,-300,4);
        platform.createBox(200,20,10,955,10,-650,4);
        platform.createBox(10,20,700,1050,10,-300,4);
        platform.createBox(200,20,10,1155,10,45,4);
        platform.createBox(10,20,700,1250,10,-300,4);
        platform.createBox(100,20,100,1250,10,-700,4);

        //Zone 5
        platform.createBox(250,100,50,200,50,50,5);
        platform.createBox(100,50,50,200,180,50,5);
        platform.createBox(50,170,50,350,85,50,5);
        platform.createBox(50,210,250,200,105,-100,5);
        platform.createBox(250,200,50,500,100,50,5);
        platform.createBox(100,50,50,500,280,50,5);
        platform.createBox(50,250,50,600,250/2,200,5);
        platform.createBox(50,250,50,600,250/2,400,5);
        platform.createBox(50,250,50,600,250/2,600,5);
        platform.createBox(50,250,50,600,250/2,800,5);
        platform.createBox(250,300,50,400,150,800,5);
        platform.createBox(100,50,50,400,380,800,5);
        platform.createBox(250,370,50,150,370/2,800,5);
        platform.createBox(100,50,50,150,440,800,5);
        platform.createBox(50,400,50,50,200,700,5);
        platform.createBox(50,450,50,50,225,600,5);
        platform.createBox(50,500,50,50,250,500,5);
        platform.createBox(50,550,50,50,275,400,5);
        platform.createBox(50,600,50,50,300,300,5);
        platform.createBox(50,650,50,50,325,200,5);
        platform.createBox(50,700,50,50,350,100,5);
        platform.createBox(50,750,50,150,375,100,5);
        platform.createBox(50,800,50,250,400,100,5);
        platform.createBox(50,850,50,350,425,100,5);
        platform.createBox(50,850,50,350,425,200,5);
        platform.createBox(300,850,300,350,425,450,5);
        platform.createBox(250,850,250,350,850/2,450,5);
        platform.createBox(200,900,200,350,900/2,450,5);
        platform.createBox(150,950,150,350,950/2,450,5);
        platform.createBox(100,1000,100,350,1000/2,450,5);
        platform.createBox(50,1050,50,350,1050/2,450,5);

        for (let j = 1; j < Platform.boxes.length; j++) {
            for (let i = 0; i < Platform.boxes[j].length; i++) {
                water.addToRenderList(Platform.boxes[j][i]);
            }
        }

        const pointerlockchange = (): void => {
            let controlEnabled = document.pointerLockElement || null;
            // If the user is already locked
            if (!controlEnabled) {
                mainCamera.detachControl();
                isLocked = false;
            } else {
                mainCamera.attachControl(this.canvas);
                isLocked = true;
            }
        };

        // ajout des graines
        SceneLoader.ImportMesh("", "./assets/meshes/", "Sunflower_Seed_High_Poly.obj", this.scene, (meshes) => {
            let mesh = meshes[0];
            let meshesList: AbstractMesh[] = [];
            for(let i = 0; i < 5; i++)
                meshesList.push(mesh.clone("graine"+ (i+1), null, true));
            // graines 1 à 5 (index 0 à 4)
            meshesList.forEach((mesh) => {
                switch (mesh.name) {
                    case "graine1":
                        mesh.position = new Vector3(-375,130*2,425);
                        break;
                    case "graine2":
                        mesh.position = new Vector3(150,15*2,-1125);
                        break;
                    case "graine3":
                        mesh.position = new Vector3(-500,15*2,-755);
                        break;
                    case "graine4":
                        mesh.position = new Vector3(1250,15*2,-700);
                        break;
                    case "graine5":
                        mesh.position = new Vector3(350, 1060, 450);
                        break;
                }
                mesh.scaling = new Vector3(5, 5, 5);
                mesh.checkCollisions = true;
            });

        });

        if (!this.dialogAlreadyPast) {
            const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
            guiTexture.idealHeight = 720; //fit our fullscreen ui to this height

            const dialogBox1 = new TextBlock("title", "Voyageur, la planète se dépeuple de toute sa végétation à cause des humains.");
            dialogBox1.resizeToFit = true;
            dialogBox1.fontFamily = "Pangolin";
            dialogBox1.fontSize = "24px";
            dialogBox1.color = "white";
            dialogBox1.top = "50px";
            dialogBox1.width = "0.8";
            dialogBox1.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiTexture.addControl(dialogBox1);

            const dialogBox2 = new TextBlock("title", "Récupérez toutes les graines que vous trouverez afin de lui redonner une vie, et de montrer ce qu'est l'espoir à ses habitants.");
            dialogBox2.resizeToFit = true;
            dialogBox2.fontFamily = "Pangolin";
            dialogBox2.fontSize = "24px";
            dialogBox2.color = "white";
            dialogBox2.top = "80px";
            dialogBox2.width = "0.8";
            dialogBox2.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiTexture.addControl(dialogBox2);

            const okBtn = Button.CreateSimpleButton("ok", "OK");
            okBtn.fontFamily = "Pangolin";
            okBtn.width = 0.2;
            okBtn.height = "40px";
            okBtn.color = "white";
            okBtn.top = "200px";
            okBtn.thickness = 0;
            okBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            guiTexture.addControl(okBtn);

            okBtn.onPointerDownObservable.add( () => {
                guiTexture.removeControl(dialogBox1);
                guiTexture.removeControl(dialogBox2);
                guiTexture.removeControl(okBtn);
                this.dialogAlreadyPast = true;
            });
        }

        document.addEventListener("pointerlockchange", pointerlockchange, false);
    }

    private async gameOver() : Promise<void> {
        Platform._level = 1;
        this.engine.displayLoadingUI();
        this.scene.detachControl();
        CameraInput.seedsObtained = 0;
        let scene = new Scene(this.engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let cameraGO = new UniversalCamera("cameraGameOver", new Vector3(0, 0, 0), scene);
        cameraGO.setTarget(Vector3.Zero());

        const soundSelection = new Sound("selection", "./assets/sounds/selection.ogg", scene, function() {
        }, {
            volume: 0.55 * App.sfxMult
        });
        const soundConfirmation = new Sound("confirmation", "./assets/sounds/click.ogg", scene, function() {
        }, {
            volume: App.sfxMult
        });

        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720; //fit our fullscreen ui to this height

        let gameOverText = new TextBlock("gameOver", "Game Over");
        gameOverText.resizeToFit = true;
        gameOverText.fontFamily = "Pangolin";
        gameOverText.fontSize = "64px";
        gameOverText.color = "red";
        gameOverText.top = "-200px";
        gameOverText.width = "0.8";
        gameOverText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(gameOverText);

        const retryBtn = Button.CreateSimpleButton("retry", "Recommencer");
        retryBtn.width = 0.2;
        retryBtn.height = "40px";
        retryBtn.fontFamily = "Pangolin";
        retryBtn.color = "white";
        retryBtn.top = "-60px";
        retryBtn.thickness = 0;
        retryBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(retryBtn);

        const returnMMBtn = Button.CreateSimpleButton("mainmenu", "Retour au menu principal");
        returnMMBtn.width = 0.2;
        returnMMBtn.height = "40px";
        returnMMBtn.fontFamily = "Pangolin";
        returnMMBtn.color = "white";
        returnMMBtn.top = "-30px";
        returnMMBtn.thickness = 0;
        returnMMBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(returnMMBtn);

        retryBtn.onPointerEnterObservable.add(() => {
            soundSelection.play();
        });

        returnMMBtn.onPointerEnterObservable.add(() => {
            soundSelection.play();
        });

        retryBtn.onPointerDownObservable.add(() => {
            soundConfirmation.play();
            this.gameItself();
            scene.detachControl();
        });

        returnMMBtn.onPointerDownObservable.add(() => {
            soundConfirmation.play();
            this.gameInitialization();
            scene.detachControl();
        });

        await scene.whenReadyAsync();
        this.engine.hideLoadingUI();
        this.scene.dispose();
        this.scene = scene;
        this.state = State.GAMEOVER;
    }

    private async gameEnd() : Promise<void> {

        this.engine.displayLoadingUI();
        this.scene.detachControl();
        let scene = new Scene(this.engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let cameraEnd = new UniversalCamera("cameraEnd", new Vector3(0, 0, 0), scene);
        cameraEnd.setTarget(Vector3.Zero());

        const soundSelection = new Sound("selection", "./assets/sounds/selection.ogg", scene, function() {
        }, {
            volume: 0.55 * App.sfxMult
        });
        const soundConfirmation = new Sound("confirmation", "./assets/sounds/click.ogg", scene, function() {
        }, {
            volume: App.sfxMult
        });

        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720; //fit our fullscreen ui to this height

        let endText = new TextBlock("end", "Vous avez fini le jeu");
        endText.resizeToFit = true;
        endText.fontFamily = "Pangolin";
        endText.fontSize = "64px";
        endText.color = "white";
        endText.top = "-200px";
        endText.width = "0.8";
        endText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(endText);

        const retryBtn = Button.CreateSimpleButton("retry", "Recommencer");
        retryBtn.width = 0.2;
        retryBtn.height = "40px";
        retryBtn.fontFamily = "Pangolin";
        retryBtn.color = "white";
        retryBtn.top = "-60px";
        retryBtn.thickness = 0;
        retryBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(retryBtn);

        const returnMMBtn = Button.CreateSimpleButton("mainmenu", "Retour au menu principal");
        returnMMBtn.width = 0.2;
        returnMMBtn.height = "40px";
        returnMMBtn.fontFamily = "Pangolin";
        returnMMBtn.color = "white";
        returnMMBtn.top = "-30px";
        returnMMBtn.thickness = 0;
        returnMMBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(returnMMBtn);

        retryBtn.onPointerEnterObservable.add(() => {
            soundSelection.play();
        });

        returnMMBtn.onPointerEnterObservable.add(() => {
            soundSelection.play();
        });

        retryBtn.onPointerDownObservable.add(() => {
            soundConfirmation.play();
            this.gameItself();
            scene.detachControl();
        });

        returnMMBtn.onPointerDownObservable.add(() => {
            soundConfirmation.play();
            this.gameInitialization();
            scene.detachControl();
        });

        await scene.whenReadyAsync();
        this.engine.hideLoadingUI();
        this.scene.dispose();
        this.scene = scene;
        this.state = State.END;
    }

    private mainCameraSetup(): UniversalCamera {

        let mainCamera: UniversalCamera = new UniversalCamera("Player Camera", new Vector3(0, 60, 0), this.scene);
        mainCamera.inputs.add(new CameraInput(mainCamera));
        mainCamera.applyGravity = true;
        mainCamera.checkCollisions = true;
        mainCamera.ellipsoid = new Vector3(5, 20, 5);
        mainCamera.attachControl(this.canvas, true);
        return mainCamera;
    }


    CreateGroundMaterial() : StandardMaterial {
        const textures : Texture[] = [];
        let groundMat: StandardMaterial = new StandardMaterial("groundMat", this.scene);

        let texture = new Texture("./assets/textures/sand/sand_diff.jpg", this.scene);
        groundMat.diffuseTexture = texture;
        textures.push(texture);

        let texture2 = new Texture("./assets/textures/sand/sand_nor_gl.jpg", this.scene);
        groundMat.bumpTexture = texture2;
        textures.push(texture2);

        let texture3 = new Texture("./assets/textures/sand/sand_ao.jpg", this.scene);
        groundMat.ambientTexture = texture3;
        textures.push(texture3);

        let texture4 = new Texture("./assets/textures/sand/sand_spec.jpg", this.scene);
        groundMat.specularTexture = texture4;

        textures.push(texture4);
        textures.forEach((texture) => {
            texture.uScale = 4;
            texture.vScale = 4;
        });

        return groundMat;
    }

    private showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.display = 'block';
    }

    private hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.display = 'none';
    }

}

new App();