import React, {Suspense,useRef, useState,forwardRef, useLayoutEffect, useEffect, useImperativeHandle, useCallback, useMemo} from 'react';
import { Canvas, useFrame, useThree, PointerEvent } from 'react-three-fiber';
import * as THREE from 'three';
import Text from './Text'
import PartyLight from './partyLight'
import { Mesh, MeshStandardMaterial } from 'three';

import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

enum Dir{
    UP,DN,RT,LT,FR,BK
}

function getPos(d:Dir): THREE.Vector3{
    switch(d){
        case Dir.UP: return new THREE.Vector3(0,0.5,0);
        case Dir.DN: return new THREE.Vector3(0,-0.5,0);
        case Dir.LT: return new THREE.Vector3(-0.5,0,0);
        case Dir.RT: return new THREE.Vector3(0.5,0,0);
        case Dir.BK: return new THREE.Vector3(0,0,-0.5);
        case Dir.FR: return new THREE.Vector3(0,0,0.5);
    }
}
function getRot(d:Dir){
    const HP = Math.PI/2;
    switch(d){
        case Dir.UP: return new THREE.Vector3(HP,0,0);//wh
        case Dir.DN: return new THREE.Vector3(HP,0,0);//ye
        case Dir.LT: return new THREE.Vector3(0,HP,0);//bl
        case Dir.RT: return new THREE.Vector3(0,HP,0);//gre
        case Dir.BK: return new THREE.Vector3(0,0,0);//or
        case Dir.FR: return new THREE.Vector3(0,0,0);//red
    }
}

class BlockInfo{
    public materials: [string|number|THREE.Color, Dir][] = [];
    public position: THREE.Vector3 = new THREE.Vector3();
    public quaternion: THREE.Quaternion = new THREE.Quaternion(0,0,0,0);
    public show: boolean = true;

    constructor(colors:[(string|number|THREE.Color),Dir][], position:THREE.Vector3){
        this.materials = colors;//.map(c=>[new THREE.MeshPhongMaterial({color:c[0], side: THREE.DoubleSide}), c[1]]); 
        this.position.copy(position);
    }

}

function zip(l1:any[], l2:any[]):any[]{
    return l1.map((e,i)=>[e, l2[i]]);
}

//const Block: React.FC<{block:BlockInfo, ref:React.RefObject<any>, onMouseDown?:Function, onMouseUp?:Function, onMouseMove?:Function, id:number}> = (props) =>{
function useCombinedRefs(...refs:any[]) {
    const targetRef = React.useRef()

    React.useEffect(() => {
        refs.forEach(ref => {
            if (!ref) return

            if (typeof ref === 'function') {
                ref(targetRef.current)
            } else {
                ref.current = targetRef.current
            }
        })
    }, [refs])

    return targetRef
}

const Block= forwardRef<Mesh,{block:BlockInfo, show:boolean, onMouseDown?:Function, onMouseUp?:Function, onMouseMove?:Function, id:number}>((props, ref) =>{
    const {gl, scene, camera, size} = useThree();
    //const blockRef:React.RefObject<Mesh> = useRef<Mesh>(null);
    const {block, onMouseDown, show, onMouseUp, onMouseMove, id} = props;
    const cubeRef = useRef<Mesh>(null);
    const combinedRef = useCombinedRefs(ref,cubeRef)

    //useEffect(()=>console.log(show));
    useFrame(()=>{
        cubeRef.current!.visible = block.show || show;
        
    });
    return (
        <mesh ref={combinedRef} position={block.position}>
            {block.materials.map((matdir ,idx)=> {
                const [col, dir]: [(string | number | THREE.Color), Dir] = matdir;
                return (
                    <mesh position={getPos(dir)} rotation={[getRot(dir).x, getRot(dir).y, getRot(dir).z]} key={idx}
                        onPointerDown={(e) => {
                            if(onMouseDown)
                                onMouseDown(id,dir,e);
                        }}
                        onPointerUp={(e) => {
                            if(onMouseUp)
                            onMouseUp(id);
                        }}
                        onPointerMove={(e) => {
                            if(onMouseMove)
                            onMouseMove(id,e);
                        }}>
                        <planeBufferGeometry attach="geometry" args={[0.9, 0.9]} />
                        <meshStandardMaterial attach="material" color={col} side={THREE.DoubleSide} />
                    </mesh>);
            }
            )}
        </mesh>
    );
});

function makeCube(show:boolean = true){
    const ret:BlockInfo[][][] = [];

    for(let d = 0; 3 > d; d++){
        ret.push(new Array<Array<BlockInfo>>());
        for(let c = 0; 3 > c; c++){
            ret[d].push(new Array<BlockInfo>());
            for(let r = 0; 3 > r; r++){
                const color:[(string|number),Dir][] = [];
                if(d === 0) color.push(["white", Dir.DN]);
                if(d === 2) color.push(["yellow", Dir.UP]);
                if(c === 0) color.push(["green", Dir.BK]);
                if(c === 2) color.push(["blue", Dir.FR]);
                if(r === 0) color.push(["orange", Dir.LT]);
                if(r === 2) color.push(["red", Dir.RT]);
                ret[d][c].push(new BlockInfo(color, new THREE.Vector3(r-1,d-1,c-1)));
                ret[d][c][r].show=show;
            }
        }
    }
    return ret;
}

function ExtVec2(v:THREE.Vector3):THREE.Vector2{return new THREE.Vector2(v.x, v.y);}
function absVec(v:THREE.Vector3):THREE.Vector3{return new THREE.Vector3(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));}

function copyCube(cube:BlockInfo[][][]){
    const ret:BlockInfo[][][] = [];

    for(let d = 0; 3 > d; d++){
        ret.push(new Array<Array<BlockInfo>>());
        for(let c = 0; 3 > c; c++){
            ret[d].push(new Array<BlockInfo>());
            for(let r = 0; 3 > r; r++){
                ret[d][c].push(new BlockInfo(cube[d][c][r].materials.slice(0,cube[d][c][r].materials.length), new THREE.Vector3(r-1,d-1,c-1)));
                ret[d][c][r].show = cube[d][c][r].show;
                ret[d][c][r].quaternion.copy(cube[d][c][r].quaternion);
            }
        }
    }
    return ret;
}

function getRandomInt(max:number) {
    return Math.floor(Math.random() * Math.floor(max));
}

function rotCube90(cube:BlockInfo[][][], axis:string, apos:number, angle:number){


    var sq: BlockInfo[][] = [[]];
    for (let d = 0; 3 > d; d++)
        for (let c = 0; 3 > c; c++)
            for (let r = 0; 3 > r; r++) {
                if (axis === 'd' && apos !== d) continue;
                if (axis === 'c' && apos !== c) continue;
                if (axis === 'r' && apos !== r) continue;
                const cb = cube[d][c][r];
                sq[sq.length - 1].push(cb);
                if (sq[sq.length - 1].length === 3) sq.push([]);
            }
    if (axis === 'c') sq.map(l => l.reverse());

    for (var i = 0; angle > i; i++) {
        const mats: [string | number | THREE.Color, Dir][][][] = sq.map(l => l.map(
            b => b.materials.map(s => {
                if (axis === 'd') {
                    switch (s[1]) {
                        case Dir.LT: return [s[0], Dir.FR];
                        case Dir.FR: return [s[0], Dir.RT];
                        case Dir.RT: return [s[0], Dir.BK];
                        case Dir.BK: return [s[0], Dir.LT];
                        default: return s;
                    }
                }

                else if (axis === 'c') {
                    switch (s[1]) {
                        case Dir.UP: return [s[0], Dir.LT];
                        case Dir.DN: return [s[0], Dir.RT];
                        case Dir.LT: return [s[0], Dir.DN];
                        case Dir.RT: return [s[0], Dir.UP];
                        default: return s;
                    }
                }

                else if (axis === 'r') {
                    switch (s[1]) {
                        case Dir.UP: return [s[0], Dir.FR];
                        case Dir.DN: return [s[0], Dir.BK];
                        case Dir.FR: return [s[0], Dir.DN];
                        case Dir.BK: return [s[0], Dir.UP];
                        default: return s;
                    }
                }
                else return s;
            })
        ));

        sq[0][0].materials = mats[0][2];
        sq[0][1].materials = mats[1][2];
        sq[0][2].materials = mats[2][2];
        sq[1][0].materials = mats[0][1];
        sq[1][2].materials = mats[2][1];
        sq[2][0].materials = mats[0][0];
        sq[2][1].materials = mats[1][0];
        sq[2][2].materials = mats[2][0];
    }
}

function clearedCube(cube:BlockInfo[][][]){
    var colss:(string | number | THREE.Color)[][] = [[],[],[],[],[],[]];

    cube.flat(2).map(block=>block.materials.map(cd=>colss[cd[1]].push(cd[0])));
    return colss.reduce(
        (f1:boolean,cols)=>f1 && cols.reduce((f2,col)=>f2 && col === cols[0], true),
        true);
}

function shuffleCube(cube:BlockInfo[][][], times:number){
    do{
    for(var i = 0; times > i; i++)
        rotCube90(cube, ['d','c','r'][getRandomInt(3)], getRandomInt(3), getRandomInt(4));
    }while(clearedCube(cube));
    return cube;
}


const Cube: React.FC<{position:THREE.Vector3, cubeQuaternion:THREE.Quaternion, canvasRef:React.RefObject<HTMLDivElement>, onHand?:Function, onClear?:Function}> = (props) => {
    const ref = useRef<Mesh>(null);
    const rotCubeRef = useRef<Mesh>(null);
    const blockRefs = [
        [[useRef<Mesh>(null),useRef<Mesh>(null),useRef<Mesh>(null)],[useRef<Mesh>(null),useRef<Mesh>(null),useRef<Mesh>(null)],[useRef<Mesh>(null),useRef<Mesh>(null),useRef<Mesh>(null)]],
        [[useRef<Mesh>(null),useRef<Mesh>(null),useRef<Mesh>(null)],[useRef<Mesh>(null),useRef<Mesh>(null),useRef<Mesh>(null)],[useRef<Mesh>(null),useRef<Mesh>(null),useRef<Mesh>(null)]],
        [[useRef<Mesh>(null),useRef<Mesh>(null),useRef<Mesh>(null)],[useRef<Mesh>(null),useRef<Mesh>(null),useRef<Mesh>(null)],[useRef<Mesh>(null),useRef<Mesh>(null),useRef<Mesh>(null)]]]
    const {gl, scene, camera, size} = useThree();
    const [upd,setUpd] = useState(false);
    const [dragging, setDragging] = useState<[BlockInfo,Dir]|null>(null);
    const [dragStartPos, setDragStartPos] = useState(new THREE.Vector2(0,0));
    const [cleared, setCleared] = useState(false);
    const [handCount, setHandCount] = useState(0);

    const blocks = useRef(shuffleCube(makeCube() , 5));
    const rotBlocks = useRef(copyCube(blocks.current));
    const rotQ = useRef(new THREE.Quaternion());
    const rot = useRef<[string, number, number]>(['x',0,0]);

    useFrame(() => {
        if(ref.current){
            if(cleared){
                ref.current.rotation.set(ref.current.rotation.x+0.07,ref.current.rotation.y+0.07,ref.current.rotation.z+0.07);
            }
            else{
                ref.current.quaternion.copy(props.cubeQuaternion);
                rotCubeRef.current?.quaternion.copy(rotQ.current);
            }
                        //console.log(dragging);
        }
    })

    const [dPos1, setDPos1] = useState(new THREE.Vector3(0,0,-10));
    const [dPos2, setDPos2] = useState(new THREE.Vector3(0,0,-10));
    
    const onMouseUp = useMemo(() => {
        return () => {
            const angle =(Math.round(rot.current[2] / (Math.PI / 2))%4 + 4)%4;
            if(dragging && rot.current[0] !== 'x' && angle !== 0){
                rotCube90(blocks.current!, rot.current[0], rot.current[1], angle);
                rotBlocks.current = copyCube(blocks.current);
                if(clearedCube(blocks.current)){
                    //console.log('cleared!!!');
                    setCleared(true);
                    if(props.onClear) props.onClear();
                }
                if(props.onHand)
                    props.onHand();
                setHandCount(c=>c+1);
            }
            rot.current = ['x',0,0];
            blocks.current.flat(2).map((cb) => cb.show = true);
            rotBlocks.current.flat(2).map((cb) => cb.show = false);

            setDragging(null);
        };
    }, [dragging, rot]);
    const pMove = useMemo(() => {
        return (mPos: THREE.Vector2) => {
            if (!dragging) return;
            const b = dragging![0];
            const dir = dragging![1];
            const moveVec = mPos.sub(dragStartPos);
            var vec1 = new THREE.Vector2(0, 0);
            var vec2 = new THREE.Vector2(0, 0);
            const q = new THREE.Quaternion();
            if(blockRefs[Math.round(b.position.y+1)][Math.round(b.position.z+1)][Math.round(b.position.x+1)].current === null) return;

            
            blockRefs[Math.round(b.position.y+1)][Math.round(b.position.z+1)][Math.round(b.position.x+1)].current!.getWorldQuaternion(q);

            var dirs: Dir[] = [];
            if (dir === Dir.UP) dirs = [Dir.LT, Dir.FR];
            if (dir === Dir.DN) dirs = [Dir.RT, Dir.BK];
            if (dir === Dir.RT) dirs = [Dir.BK, Dir.UP];
            if (dir === Dir.LT) dirs = [Dir.FR, Dir.DN];
            if (dir === Dir.FR) dirs = [Dir.DN, Dir.RT];
            if (dir === Dir.BK) dirs = [Dir.UP, Dir.LT];
            vec1 = ExtVec2(getPos(dirs[0]).applyQuaternion(q).project(camera)).normalize();
            vec2 = ExtVec2(getPos(dirs[1]).applyQuaternion(q).project(camera)).normalize();

            // console.log(q);
            // console.log(dir);
            // console.log(moveVec);
            var moveDir = Dir.UP;
            var angle = 0.0;

            if (Math.abs(vec1.dot(moveVec)) > Math.abs(vec2.dot(moveVec))) {
                moveDir = dirs[1];
                angle = vec1.dot(moveVec);
                // console.log('vec1');
                // console.log(angle);
            }
            else {
                moveDir = dirs[0];
                angle = vec2.dot(moveVec);
                // console.log('vec2'+vec2);
                // console.log(angle);
            }
            angle=angle/70.0;
            // console.log(dir);
            // console.log(moveDir);
            //console.log(angle);

            // var bufQ = new THREE.Quaternion();
            // bufQ
            rotQ.current.setFromAxisAngle(absVec(getPos(moveDir).normalize()), angle);;

            var bpos = new THREE.Vector3();
            bpos.copy(b.position);
            var ax = 'x';
            var cd = 0;
            if (moveDir === Dir.RT || moveDir === Dir.LT) {ax='r'; cd = bpos.x+1;}
            if (moveDir === Dir.FR || moveDir === Dir.BK) {ax='c'; cd = bpos.z+1;}
            if (moveDir === Dir.UP || moveDir === Dir.DN) {ax='d'; cd = bpos.y+1;}
            
            rot.current=[ax, cd, angle];
            // setDPos1(getPos(moveDir).applyQuaternion(q).normalize());
            // setDPos2(new THREE.Vector3(moveVec.x, moveVec.y, 0).normalize());

            //console.log(moveDir);
            for (let d = 0; 3 > d; d++)
                for (let c = 0; 3 > c; c++)
                    for (let r = 0; 3 > r; r++) {
                        const cb = blocks.current[d][c][r];
                        if ((moveDir === Dir.RT || moveDir === Dir.LT) && cb.position.x === bpos.x) { cb.show = false; }
                        else if ((moveDir === Dir.FR || moveDir === Dir.BK) && cb.position.z === bpos.z) { cb.show = false; }
                        else if ((moveDir === Dir.UP || moveDir === Dir.DN) && cb.position.y === bpos.y) { cb.show = false; }
                        else { cb.show = true; }
                    }

            for (let d = 0; 3 > d; d++)
                for (let c = 0; 3 > c; c++)
                    for (let r = 0; 3 > r; r++) {
                        const cb = rotBlocks.current[d][c][r];
                        if ((moveDir === Dir.RT || moveDir === Dir.LT) && cb.position.x === bpos.x) { cb.show = true; }
                        else if ((moveDir === Dir.FR || moveDir === Dir.BK) && cb.position.z === bpos.z) { cb.show = true; }
                        else if ((moveDir === Dir.UP || moveDir === Dir.DN) && cb.position.y === bpos.y) { cb.show = true; }
                        else { cb.show = false; }
                    }

        };
    }, [camera,dragStartPos,dragging, blockRefs]);
    useEffect(()=>{
        const moveHandler = (e:MouseEvent)=>pMove(new THREE.Vector2(e.clientX, -e.clientY));
        
        props.canvasRef.current!.addEventListener('mousemove', moveHandler);
        props.canvasRef.current!.addEventListener('mouseup', onMouseUp);
        return () => {
            props.canvasRef.current!.removeEventListener('mousemove', moveHandler);
            props.canvasRef.current!.removeEventListener('mouseup', onMouseUp);
        };
    }, [props.canvasRef, onMouseUp, pMove]);

    return (
        <mesh>
            <Suspense fallback={null}>
                <Text color={"#00ff00"} position={new THREE.Vector3(0,size.height/14,0)} size={0.4} height={6} visible={cleared}>CLEAR!</Text>
                <Text color={"#00ff00"} position={new THREE.Vector3(0,-size.height/7,0)} height={0} size={0.2}>{String(handCount)+" MOVE"}</Text>
            </Suspense>
        <mesh position={props.position} ref={ref} >
            {blocks.current.flat(2).map((block, idx) => <Block show={dragging===null} ref={blockRefs[Math.round(block.position.y+1)][Math.round(block.position.z+1)][Math.round(block.position.x+1)]} block={block} key={idx} id={idx} 
                onMouseDown={(swid:number, dir:Dir, e:PointerEvent)=>{
                    if(cleared) return;
                    e.stopPropagation();
                    //console.log('dragst'+swid + dir);
                    setDragStartPos(new THREE.Vector2(e.clientX,-e.clientY));
                    setDragging([block,dir]);
                    
                    // rotBlocks.current=copyCube(blocks.current);
                    // for (let d = 0; 3 > d; d++) {
                    //     for (let c = 0; 3 > c; c++) {
                    //         for (let r = 0; 3 > r; r++) {
                    //             rotBlocks.current[d][c][r].materials = blocks.current[d][c][r].materials.slice(0, blocks.current[d][c][r].materials.length);
                    //             rotBlocks.current[d][c][r].show = blocks.current[d][c][r].show;
                    //             rotBlocks.current[d][c][r].quaternion.copy(blocks.current[d][c][r].quaternion);
                    //         }
                    //     }
                    // }
                    rotQ.current=new THREE.Quaternion();
                }}/>
            )}
            
            <mesh ref={rotCubeRef}>
                {rotBlocks.current.flat(2).map((block, idx) =>dragging&& <Block show={false} block={block} key={idx} id={idx}  />
                )}
            </mesh>
        </mesh>
            {/* <mesh position={dPos1}>
            <boxBufferGeometry attach="geometry" args={[0.5,0.5,0.5]} />
            <meshStandardMaterial attach="material" color={'hotpink'} />
            </mesh> 
            <mesh position={dPos2}>
            <boxBufferGeometry attach="geometry" args={[0.5,0.5,0.5]} />
            <meshStandardMaterial attach="material" color={'orange'} />
            </mesh> */}
        </mesh>
    );
}

const debounce = (fn: Function, interval: number) => {
    var timer: number;
    return function() {
      clearTimeout(timer)
      timer = window.setTimeout(function() {
        fn()
      }, interval)
    }
  }

export const useRect = () => {
    const [rect, setRect] = useState<ClientRect | DOMRect>();
    const ref = useRef<HTMLDivElement | null>(null);
  
    const resize = useCallback(() => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setRect(rect);
      }
    }, []);
    useEffect(() => resize(), [resize]);
  
    const handleResize = debounce(resize, 16);
    useEffect(() => {
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [handleResize]);
  
    return { ref, rect };
  };

export default function RubiksCubeGame() {
    const { ref, rect } = useRect();
    const [dragCube, setDragCube] = useState(false);
    const quaternion = useRef(new THREE.Quaternion());
    const dragBefPos = useRef({x:0, y:0});
    const [count, setCount] = useState(0);
    const [cleared, setCleared] = useState(false);

    // useLayoutEffect(() => {
    //     if(ref.current){
    //         setElmSize({w:ref.current.offsetWidth, h:ref.current.offsetHeight});
    //     }
    // }, []);

    useEffect(()=>{
        if(cleared){
            (window as any).twttr.widgets.load(document.getElementsByClassName("App"));
        }
    });

    const onDrag = (e:PointerEvent) => {
        if(dragCube && ref){
            var buf = quaternion.current;
            var delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(
                2*Math.PI * (e.sourceEvent.clientY - dragBefPos.current.y) / Math.min(rect!.height,rect!.width),
                2*Math.PI * (e.sourceEvent.clientX - dragBefPos.current.x) / Math.min(rect!.height,rect!.width),
                0,
                "XYZ"
            ));
            
            buf.multiplyQuaternions(delta, buf);
            
            quaternion.current.copy(buf);
        
            // console.log(rect);
            // console.log(buf);
            dragBefPos.current.x = e.clientX;
            dragBefPos.current.y = e.clientY;
        }
    };

    return (
        <div ref={ref} style={{ width: "100%", height: "100%" }}>
            <Canvas>
                <PartyLight position={new THREE.Vector3(0, 0, 5)} angle={0.3} visible={cleared} />
                <ambientLight intensity={0.3} />
                <pointLight position={[2, 2, 2]} intensity={1} visible={!cleared} />
                <mesh onPointerDown={(e) => {
                    //console.log('push'); 
                    setDragCube(true);
                    dragBefPos.current.x = e.clientX;
                    dragBefPos.current.y = e.clientY;
                }}
                    onPointerUp={() => setDragCube(false)} onPointerOut={() => setDragCube(false)} onPointerMove={onDrag}>

                    <Cube position={new THREE.Vector3(0, 0, -5)} cubeQuaternion={quaternion.current} canvasRef={ref} onHand={() => setCount(c => c + 1)} onClear={() => setCleared(true)} />
                    <mesh position={[0, 0, -20]} >
                        <planeBufferGeometry attach="geometry" args={[1000, 1000]} />
                        <meshStandardMaterial attach="material" color={'white'} side={THREE.DoubleSide} />
                    </mesh>
                </mesh>
            </Canvas>
            {cleared &&
                <Box position="absolute" top="50%" left="50%">
                    <a data-size="large" href="https://twitter.com/share?ref_src=twsrc%5Etfw" className="twitter-share-button"
                        data-text={count+"手でルービックキューブとけた！"} data-show-count="false">Tweet</a>
                </Box>
            }
        </div>
    );
}