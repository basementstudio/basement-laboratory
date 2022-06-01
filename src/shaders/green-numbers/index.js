export const vertex = /* glsl */ `
    attribute vec2 uv;
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
    }
`

export const fragment = /* glsl */ `
    precision highp float;
    uniform float uTime;
    uniform vec3 uResolution;
    float time;

    float noise(vec2 p) {
        return sin(p.x*10.) * sin(p.y*(3. + sin(time/11.))) + .2; 
    }

    mat2 rotate(float angle) {
        return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    }

    float fbm(vec2 p) {
        p *= 1.1;
        float f = 0.;
        float amp = .5;
        for( int i = 0; i < 3; i++) {
            mat2 modify = rotate(time/50. * float(i*i));
            f += amp*noise(p);
            p = modify * p;
            p *= 2.;
            amp /= 2.2;
        }
        return f;
    }

    float pattern(vec2 p, out vec2 q, out vec2 r) {
        q = vec2( fbm(p + vec2(1.)), fbm(rotate(.1*time)*p + vec2(1.)));
        r = vec2( fbm(rotate(.1)*q + vec2(0.)), fbm(q + vec2(0.)));
        return fbm(p + 1.*r);
    }

    float sampleFont(vec2 p, float num) {
        float glyph[2];
        if (num < 1.)      { glyph[0] = 0.91333008; glyph[1] = 0.89746094; }
        else if (num < 2.) { glyph[0] = 0.27368164; glyph[1] = 0.06933594; }
        else if (num < 3.) { glyph[0] = 1.87768555; glyph[1] = 1.26513672; }
        else if (num < 4.) { glyph[0] = 1.87719727; glyph[1] = 1.03027344; }
        else if (num < 5.) { glyph[0] = 1.09643555; glyph[1] = 1.51611328; }
        else if (num < 6.) { glyph[0] = 1.97045898; glyph[1] = 1.03027344; }
        else if (num < 7.) { glyph[0] = 0.97045898; glyph[1] = 1.27246094; }
        else if (num < 8.) { glyph[0] = 1.93945312; glyph[1] = 1.03222656; }
        else if (num < 9.) { glyph[0] = 0.90893555; glyph[1] = 1.27246094; }
        else               { glyph[0] = 0.90893555; glyph[1] = 1.52246094; }
        
        float pos = floor(p.x + p.y * 5.);
        if (pos < 13.) {
            return step(1., mod(pow(2., pos) * glyph[0], 2.));
        } else {
            return step(1., mod(pow(2., pos-13.) * glyph[1], 2.));
        }
    }

    float digit(vec2 p) {
        p -= vec2(0.5, 0.5);
        p *= (1.+0.15*pow(length(p),0.6));
        p += vec2(0.5, 0.5);
        
        p.x += sin(uTime/7.)/5.;
        p.y += sin(uTime/13.)/5.;
            
        vec2 grid = vec2(3.,1.) * 15.;
        vec2 s = floor(p * grid) / grid;
        p = p * grid;
        vec2 q;
        vec2 r;
        float intensity = pattern(s/10., q, r)*1.3 - 0.03 ;
        p = fract(p);
        p *= vec2(1.2, 1.2);
        float x = fract(p.x * 5.);
        float y = fract((1. - p.y) * 5.);
        vec2 fpos = vec2(floor(p.x * 5.), floor((1. - p.y) * 5.));
        float isOn = sampleFont(fpos, floor(intensity*10.));
        return p.x <= 1. && p.y <= 1. ? isOn * (0.2 + y*4./5.) * (0.75 + x/4.) : 0.;
    }

    float hash(float x) {
        return fract(sin(x*234.1)* 324.19 + sin(sin(x*3214.09) * 34.132 * x) + x * 234.12);
    }

    float onOff(float a, float b, float c) {
        return step(c, sin(uTime + a*cos(uTime*b)));
    }

    float displace(vec2 look) {
        float y = (look.y-mod(uTime/4.,1.));
        float window = 1./(1.+50.*y*y);
        return sin(look.y*20. + uTime)/80.*onOff(4.,2.,.8)*(1.+cos(uTime*60.))*window;
    }

    vec3 getColor(vec2 p){
        
        float bar = mod(p.y + time*20., 1.) < 0.2 ?  1.4  : 1.;
        p.x += displace(p);
        float middle = digit(p);
        float off = 0.002;
        float sum = 0.;
        for (float i = -1.; i < 2.; i+=1.){
            for (float j = -1.; j < 2.; j+=1.){
                sum += digit(p+vec2(off*i, off*j));
            }
        }
        return vec3(0.9)*middle + sum/10.*vec3(0.,1.,0.) * bar;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
        time = uTime / 3.;
        vec2 p = fragCoord / uResolution.xy;
        float off = 0.0001;
        vec3 col = getColor(p);
        fragColor = vec4(col,1);
    }

    void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
    }
`
