class HeroAscii {
    canvas;
    domWidth = 0;
    domHeight = 0;
    width = 0;
    height = 0;
    pixelWidth = 0;
    pixelHeight = 0;
    pixelScale = 2;
    clipWidth = 0;
    highRenderTarget;
    lowRenderTarget;
    material;
    color = new Color("#364363");
    bgColor = new Color("#0f131c");
    logoContainer;
    logoOuterContainer;
    meshList = [];
    static preload() {
        sharedUniforms.u_texture.value = properties.loader.add(settings.IMAGE_PATH + "symbols.png", {
            type: "texture"
        }).content
    }
    constructor(e) {
        this.canvas = e,
        this.renderer = new WebGLRenderer({
            canvas: e
        }),
        fboHelper.init(this.renderer),
        this.scene = new Scene,
        this.camera = new OrthographicCamera(-1,1,1,-1,0,10),
        this.camera.position.z = 5,
        this.scene.add(this.camera),
        this.highRenderTarget = new WebGLRenderTarget(1,1,{
            minFilter: LinearFilter,
            magFilter: LinearFilter
        }),
        this.lowRenderTarget = this.highRenderTarget.clone(),
        this.highRenderTarget.depthBuffer = !0,
        this.lightPosition = new Vector3(2,2,2);
        let t = new ShaderMaterial({
            uniforms: {
                u_lightPosition: {
                    value: this.lightPosition
                }
            },
            vertexShader: meshVert,
            fragmentShader: meshFrag
        })
          , n = new BoxGeometry(1,1,1);
        this.logoContainer = this._createLogo(n, t),
        this.logoContainer.scale.setScalar(.38),
        this.logoOuterContainer = new Object3D,
        this.logoOuterContainer.add(this.logoContainer),
        this.scene.add(this.logoOuterContainer),
        this.logoTop = this.logoContainer.children[0],
        this.logoBottom = this.logoContainer.children[1],
        this.material = fboHelper.createRawShaderMaterial({
            uniforms: Object.assign({
                u_sceneTexture: {
                    value: this.lowRenderTarget.texture
                },
                u_sceneTextureSize: {
                    value: new Vector2(1,1)
                },
                u_color: {
                    value: this.color
                },
                u_bgColor: {
                    value: this.bgColor
                },
                u_mouseXY: {
                    value: new Vector2(0,0)
                },
                u_resolution: {
                    value: new Vector2(1,1)
                }
            }, sharedUniforms),
            fragmentShader: frag,
            derivatives: !0
        })
    }
    _createLogo(e, t) {
        let n = new Object3D
          , i = new Object3D
          , r = new Object3D;
        i.position.y = 1,
        r.position.y = -1;
        let o = this._createPart(e, t)
          , a = this._createPart(e, t);
        o.position.x = -1,
        a.position.x = 1;
        let l = this._createPart(e, t)
          , c = this._createPart(e, t);
        return l.rotation.y = Math.PI / 2,
        c.rotation.y = Math.PI / 2,
        l.position.z = -1,
        c.position.z = 1,
        i.add(o),
        i.add(a),
        r.add(l),
        r.add(c),
        n.add(i),
        n.add(r),
        n
    }
    _createPart(e, t) {
        let n = new Object3D
          , i = new Mesh(e,t)
          , r = new Mesh(e,t)
          , o = new Mesh(e,t)
          , a = new Object3D;
        a.position.z = -1,
        a.scale.setScalar(.9),
        a.add(i);
        let l = new Object3D;
        l.scale.set(.2, .2, 2),
        l.add(r);
        let c = new Object3D;
        return c.position.z = 1,
        c.scale.setScalar(.9),
        c.add(o),
        n.add(a),
        n.add(l),
        n.add(c),
        this.meshList.push(i, r, o),
        n
    }
    resize(e, t) {
        this.clipWidth = e,
        t = Math.ceil(t);
        let n = math.fit(t, 400, 1e3, 14, 24)
          , i = Math.ceil(t / n);
        n = t / i;
        let r = n * IMG_LETTER_WIDTH / IMG_LETTER_HEIGHT
          , o = Math.ceil(e / r);
        e = Math.ceil(o * r),
        this.pixelWidth = o,
        this.pixelHeight = i,
        this.lowRenderTarget.setSize(o, i),
        this.highRenderTarget.setSize(o * this.pixelScale, i * this.pixelScale),
        this.material.uniforms.u_sceneTextureSize.value.set(o, i),
        this.domWidth = e,
        this.domHeight = t;
        let a = this.width = Math.ceil(e * settings.DPR)
          , l = this.height = Math.ceil(t * settings.DPR);
        this.clipWidth = Math.floor(this.clipWidth * settings.DPR),
        this.renderer.setSize(a, l),
        this.canvas.style.width = `${e}px`,
        this.canvas.style.height = `${t}px`;
        let c = a / l;
        this.camera.left = -c,
        this.camera.right = c,
        this.camera.updateProjectionMatrix()
    }
    update(e, t, n, i) {
        let r = this.renderer;
        this.material.uniforms.u_mouseXY.value.set(n, i),
        this.material.uniforms.u_resolution.value.set(this.domWidth, this.domHeight),
        n = n / this.domWidth * 2 - 1,
        i = 1 - i / this.domHeight * 2,
        _v0.set(n, i, .5).unproject(this.camera),
        _v0.z = 5,
        this.lightPosition.copy(_v0);
        for (let a = 0; a < this.meshList.length; a++) {
            let l = a * .05 - Math.floor(a / 3) * .05
              , c = math.fit(t, l, l + .5, 0, 1, ease.backOut);
            this.meshList[a].scale.setScalar(c)
        }
        this.logoTop.position.x = math.fit(t, 0, 1, 2, 0, ease.cubicInOut),
        this.logoTop.rotation.y = math.fit(t, 0, 1, -Math.PI / 2, 0, ease.cubicInOut),
        this.logoBottom.position.x = math.fit(t, .25, 1.25, -2, 0, ease.cubicInOut),
        this.logoBottom.rotation.y = math.fit(t, .25, 1.25, Math.PI / 2, 0, ease.cubicInOut);
        let o = Math.max(0, t - 3);
        o = math.fit(o % 5, .5, 2, 0, 1, ease.expoInOut),
        this.logoContainer.rotation.set(Math.PI / 2 * o, Math.PI / 2 * o, Math.PI / 2 * o),
        this.logoOuterContainer.rotation.set(-.6, Math.PI * .25, 0),
        this.logoOuterContainer.position.x = .35,
        r.setRenderTarget(this.highRenderTarget),
        r.setClearColor(0, 1),
        r.clear(),
        r.render(this.scene, this.camera),
        fboHelper.copy(r, this.highRenderTarget.texture, this.lowRenderTarget),
        r.setRenderTarget(null),
        r.setClearColor(0, 0),
        r.clear(),
        fboHelper.render(r, this.material)
    }
}