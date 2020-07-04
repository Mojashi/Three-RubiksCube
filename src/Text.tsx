import * as THREE from 'three'
import React, { forwardRef, useMemo } from 'react'
import { useLoader, useUpdate } from 'react-three-fiber'
import { Group, Mesh } from 'three'


const Text = forwardRef<Group, {vAlign?:string,hAlign?:string,size?:number,color?:string, position?:THREE.Vector3,children:string,visible?:boolean, height?:number}>(({ children,height=3, vAlign = 'center', hAlign = 'center', size = 1,position=new THREE.Vector3(0,0,0), color = '#000000', ...props }, ref) => {
    const font = useLoader(THREE.FontLoader, '/bold.blob')
    const config = useMemo(() => ({  font,
      size: 30, height: height, curveSegments: 3,
      weight: "bold", style: "normal",
      bevelThickness: 1, bevelSize: 2, bevelEnabled: true}), [font])
    const mesh = useUpdate<Mesh>(
      self => {
        const size = new THREE.Vector3()
        self!.geometry!.computeBoundingBox()
        self!.geometry!.boundingBox!.getSize(size)
        self.position.x = position.x + (hAlign === 'center' ? -size.x / 2 : hAlign === 'right' ? 0 : -size.x)
        self.position.y = position.y + (vAlign === 'center' ? -size.y / 2 : vAlign === 'top' ? 0 : -size.y)
        self.position.z = position.z
        console.log(hAlign);
      },
      [children]
    )
    return (
      <group ref={ref} {...props} scale={[0.1 * size, 0.1 * size, 0.1]}>
        <mesh ref={mesh}>
          <textGeometry attach="geometry" args={[children, config]} />
          <meshLambertMaterial attach="material" color={color} />
        </mesh>    
    </group>
    )
  })
  
  export default Text
  