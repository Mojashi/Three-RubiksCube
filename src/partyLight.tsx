import * as THREE from 'three'
import React, { forwardRef, useMemo,useRef,useEffect } from 'react'
import { useLoader, useUpdate,useFrame,useThree } from 'react-three-fiber'
import { Group, Mesh, SpotLight } from 'three'


const PartyLight = forwardRef<Group, {angle?:number,moveF?:(t:number)=>THREE.Vector3,intensity?:number, position:THREE.Vector3,visible?:boolean}>(({angle=0.4,moveF,intensity=1, ...props }, ref) => {
  const {gl, scene, camera, size} = useThree();
    const lightRef = useRef<SpotLight>(null);
    const t = useRef(0);
    useFrame(()=>{
        var hsl:THREE.HSL = {h:0,s:0,l:0};
        lightRef.current?.color.getHSL(hsl);
        lightRef.current?.color.setHSL(hsl?.h+0.01,1,0.5);
        
        if(moveF){
          lightRef.current?.target.position.copy(moveF(t.current));
        }
        else
          lightRef.current?.target.position.set(3*Math.sin(2.2*t.current), 3*Math.sin(1.1*t.current), 0);
        t.current+=0.1;
        //if(t.current>Math.PI*2) t.current -= Math.PI*2
        //lightRef.current!.angle=lightRef.current!.angle!+0.01;
    });

    useEffect(()=>{
      scene.add(lightRef.current!.target);
      return ()=>{scene.remove(lightRef.current!.target)};
    });
    return (
      <group ref={ref} {...props}>
        <mesh>
          <spotLight ref={lightRef} angle={angle} castShadow={true} intensity={intensity} args={["0x00ffff"]} />
          
        </mesh>    
    </group>
    )
  })
  
  export default PartyLight
  