import {AssetsManager} from "@babylonjs/core";
import * as assert from "assert";

export class LoadingTask {
    private assets = [
        {
            name: "ground",
            type: "texture",
            url: "./assets/textures/ground.jpg"
        },
        {
            name: "dirt",
            type: "texture",
            url: "./assets/textures/dirt.jpg"
        },
        {
            name: "water",
            type: "texture",
            url: "./assets/textures/waterbump.png"
        },
        {
            name: "sand_ao",
            type: "texture",
            url: "./assets/textures/sand/sand_ao.jpg"
        },
        {
            name: "sand_nor_gl",
            type: "texture",
            url: "./assets/textures/sand/sand_nor_gl.jpg"
        },
        {
            name: "sand_diff",
            type: "texture",
            url: "./assets/textures/sand/sand_diff.jpg"
        },
        {
            name: "sand_spec",
            type: "texture",
            url: "./assets/textures/sand/sand_spec.jpg"
        },
        {
            name: "skybox",
            type: "cubeTexture",
            url: "./assets/skybox/TropicalSunnyDay",
        },
        {
            name: "click",
            type: "sound",
            url: "./assets/sounds/click.ogg"
        },
        {
            name: "game",
            type: "sound",
            url: "./assets/sounds/game.ogg"
        },
        {
            name: "mainmenu",
            type: "sound",
            url: "./assets/sounds/mainmenu.ogg"
        },
        {
            name: "selection",
            type: "sound",
            url: "./assets/sounds/selection.ogg"
        }
    ]

    static async load(scene) {
        let assetsManager = new AssetsManager(scene);
        let task = new LoadingTask();
        task.assets.forEach(asset => {
            switch (asset.type) {
                case "texture":
                    assetsManager.addTextureTask(asset.name, asset.url);
                    break;
                case "cubeTexture":
                    assetsManager.addCubeTextureTask(asset.name, asset.url);
                    break;
                case "sound":
                    assetsManager.addBinaryFileTask(asset.name, asset.url);
                    break;
            }
        });
        await assetsManager.loadAsync();
        return;
    }
}
