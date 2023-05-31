import {
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Texture, Mesh, Vector4
} from "@babylonjs/core";
export class Platform {
    private readonly scene;
    static _boxes: Mesh[][] = [];
    static _yBoxes: number[][];
    static _level = 1;
    constructor(scene) {
        this.scene = scene;
        Platform._yBoxes = [];
        for (let i = 1; i < 6; i++) {
            Platform._boxes[i] = [];
            Platform._yBoxes[i] = [];

        }
    }

    static get boxes() {
        return Platform._boxes;
    }

    get yBoxes() {
        return Platform._yBoxes;
    }

    static get level(): number {
        return this._level;
    }

    createBox(width, height, depth, x, y, z, zone) {
        var columns = 6;
        var rows = 1;

        const faceUV = new Array(6);

        for (let i = 0; i < 6; i++) {
            faceUV[i] = new Vector4(i / columns, 0, (i + 1) / columns, 1 / rows);
        }
        const boxMat :StandardMaterial = new StandardMaterial("boxMat");
        boxMat.diffuseTexture = new Texture("/assets/textures/dirt.jpg");
        /*switch(zone){
            case 1:
                boxMat.diffuseTexture = new Texture("/assets/textures/sand/sand_ao.jpg");
                break;
            case 2:
                boxMat.diffuseTexture = new Texture("/assets/textures/sand/sand_diff.jpg");
                break;
            case 3:
                boxMat.diffuseTexture = new Texture("/assets/textures/sand/sand_nor_gl.jpg");
                break;
            case 4:
                boxMat.diffuseTexture = new Texture("/assets/textures/sand/sand_spec.jpg");
                break;
            case 5:
                boxMat.diffuseTexture = new Texture("/assets/textures/dirt.jpg");
                break;
        }*/
        let box :Mesh = MeshBuilder.CreateBox("box", { width, height, depth, faceUV }, this.scene);
        if(zone != 1)
            box.position = new Vector3(x, -700, z);
        else
            box.position = new Vector3(x, y, z);
        box.checkCollisions = true;
        box.material = boxMat;
        Platform._boxes[zone].push(box);
        Platform._yBoxes[zone].push(y);
    }

    static platformApparais(zone){
        if(zone != 1) {
            Platform._boxes[zone].forEach((platform, i) => {
                platform.position.y = Platform._yBoxes[zone][i];
            })
        }
    }

    static newLevel(){
        this._level++;
    }
}