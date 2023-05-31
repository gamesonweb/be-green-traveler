import {
    AbstractMesh,
    FreeCamera,
    ICameraInput,
    KeyboardInfo,
    Nullable,
    Observer, StandardMaterial, Texture,
    Tools,
    UniversalCamera,
    Vector3
} from "@babylonjs/core";
import {Platform} from "./platform";

export class CameraInput implements ICameraInput<FreeCamera> {
    public readonly camera: UniversalCamera;

    public readonly walkSpeed: number = 7;
    public readonly runSpeed: number = 10;
    public readonly jumpHeight: number = 12;
    public readonly slideFactor: number = 20;

    private isDash: boolean = false;
    private isJump: boolean = false;
    private isDoubleJump: boolean = false;
    private isSlide: boolean = false;
    private wantToJump: boolean = false;
    private wantToSlide: boolean = false;
    private onKeyboardObservable: Nullable<Observer<KeyboardInfo>> = null;

    public static seedsObtained: number = 0;

    public constructor(camera: UniversalCamera) {
        this.camera = camera;

        camera.keysUp.push(90); // Z
        camera.keysLeft.push(81); // Q
        camera.keysDown.push(83); // S
        camera.keysRight.push(68); // D

        this.camera.collisionMask = 1;
        this.camera.onCollide = (collidedMesh: AbstractMesh) => {
            if ((collidedMesh.position.y * 2).toFixed(0) == (this.camera.position.y - 40).toFixed(0) && this.isJump && !this.wantToJump) {
                this.isJump = false;
                this.isDoubleJump = false;
            }

            for (let i = 1; i < 6; i++) {
                Platform.boxes[i].forEach((platforme) => {
                    if (collidedMesh.uniqueId === platforme.uniqueId && (collidedMesh.position.y * 2).toFixed(0) == (this.camera.position.y - 40).toFixed(0)) {
                        const boxMat: StandardMaterial = new StandardMaterial("boxMat");
                        boxMat.diffuseTexture = new Texture("/assets/textures/grass.jpg");
                        platforme.material = boxMat;
                    }
                })
            }
            if(collidedMesh.name != "graine5") {
                let text = collidedMesh.name.slice(0, 6)
                if (text === "graine") {
                    Platform.newLevel();
                    Platform.platformApparais(Platform.level);
                    collidedMesh.position = new Vector3(0, -10000, 0);
                    console.log("Collision graine" + collidedMesh.name)
                    CameraInput.seedsObtained++;
                }
            } else {
                CameraInput.seedsObtained++;
            }

        }
        document.addEventListener("keydown", (e) => {
            if(e.code == "ControlLeft" && !this.isJump) this.wantToSlide = true;
        });
        document.addEventListener("keyup", (e) => {
            if(e.code == "ControlLeft") this.wantToSlide = false;
        });
    }


    attachControl(noPreventDefault?: boolean): void {
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);

        this.onKeyboardObservable = this.camera.getScene().onKeyboardObservable.add((info) => {
            this.isDash = (info.type === 1 && info.event.code === "ShiftLeft");
            this.wantToJump = (info.type === 1 && info.event.code === "Space");

            if (!noPreventDefault) {
                info.event.preventDefault();
            }
        });

    }

    detachControl(): void {
        if (this.onKeyboardObservable) {
            this.camera.getScene().onKeyboardObservable.remove(this.onKeyboardObservable);
            this.onKeyboardObservable = null;
        }
    }

    private tmp = false;
    public checkInputs = (): void => {
        this.camera.speed = this.walkSpeed;
        if (this.isDash) this.camera.speed = this.runSpeed;

        if (this.wantToJump && !this.isJump) {
            this.camera.cameraDirection.y += this.jumpHeight;
            this.isJump = true;
            this.tmp = true;
        }
        if(this.wantToJump == false) this.tmp = false;

        if (this.isJump && !this.isDoubleJump && this.wantToJump && !this.tmp) {
            this.camera.cameraDirection.y += this.jumpHeight;
            this.isDoubleJump = true;
        }

        if(this.wantToSlide && !this.isSlide) {
            this.isSlide = true;
            this.camera.speed = this.runSpeed * 2;
            this.camera.ellipsoid.y = 9;
            this.camera.position.y -=18;
            let x = this.camera.getDirection(Vector3.Forward()).x * this.slideFactor;
            let z = this.camera.getDirection(Vector3.Forward()).z * this.slideFactor;
            this.camera.cameraDirection = new Vector3(x, 0, z);
        }
        if(!this.wantToSlide && this.isSlide) {
            this.isSlide = false;
            this.camera.speed = this.runSpeed;
            this.camera.ellipsoid.y = 20;
            this.camera.position.y += 20;

        }

    }

    getClassName(): string {
        return "CameraInput";
    }

    getSimpleName(): string {
        return "dash";
    }

}