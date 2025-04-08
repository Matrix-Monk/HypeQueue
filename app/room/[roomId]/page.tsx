import React from 'react'

const page = async({
  params,
}: {
  params: {
    roomId: string;
  };
    }) => {
    
    const {roomId} = params
    
  return <div>{roomId}</div>;
};

export default page
