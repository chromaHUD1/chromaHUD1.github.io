/* Dependency-free ZIP writer (stored entries) for downloading all page files. */
window.portfolioZip = function(files) {
  const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
  const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  const crc=data=>{let n=0xffffffff;for(const b of data)n=table[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;};
  const header=(size,signature)=>{const bytes=new Uint8Array(size);const view=new DataView(bytes.buffer);view.setUint32(0,signature,true);return [bytes,view];};
  for(const [name,content] of Object.entries(files)){
    const filename=encoder.encode(name),data=encoder.encode(content),checksum=crc(data);
    const [local,l]=header(30,0x04034b50);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint32(14,checksum,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,filename.length,true);
    parts.push(local,filename,data);
    const [entry,c]=header(46,0x02014b50);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint32(16,checksum,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,filename.length,true);c.setUint32(42,offset,true);central.push(entry,filename);offset+=30+filename.length+data.length;
  }
  const size=central.reduce((sum,p)=>sum+p.length,0),[end,e]=header(22,0x06054b50);const count=Object.keys(files).length;e.setUint16(8,count,true);e.setUint16(10,count,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
  return new Blob([...parts,...central,end],{type:'application/zip'});
};
