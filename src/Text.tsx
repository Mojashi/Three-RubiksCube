import * as THREE from 'three'
import React, { forwardRef, useMemo } from 'react'
import { useLoader, useUpdate } from 'react-three-fiber'
import { Group, Mesh } from 'three'


const Text = forwardRef<Group, {vAlign?:string,hAlign?:string,size?:number,color?:string, children:string}>(({ children, vAlign = 'center', hAlign = 'center', size = 1, color = '#000000', ...props }, ref) => {
    const font = useLoader(THREE.FontLoader, '/bold.blob')
    const config = useMemo(() => ({  font,
      size: 30,
      height: 30,
      curveSegments: 12,
      bevelEnabled: true,
		bevelThickness: 10,
		bevelSize: 8,
		bevelOffset: 0,
		bevelSegments: 5}), [font])
    const mesh = useUpdate<Mesh>(
      self => {
        const size = new THREE.Vector3()
        self!.geometry!.computeBoundingBox()
        self!.geometry!.boundingBox!.getSize(size)
        self.position.x = hAlign === 'center' ? -size.x / 2 : hAlign === 'right' ? 0 : -size.x
        self.position.y = vAlign === 'center' ? -size.y / 2 : vAlign === 'top' ? 0 : -size.y
        console.log(hAlign);
      },
      [children]
    )
    return (
      <group ref={ref} {...props} scale={[0.1 * size, 0.1 * size, 0.1]}>
        <mesh ref={mesh}>
          <textGeometry attach="geometry" args={[children, config]} />
          <meshNormalMaterial attach="material" />
        </mesh>    
    </group>
    )
  })
  
  export default Text
  