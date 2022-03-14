import React, { useEffect, useState } from "react";

export const Button = ({title}) => {
  return (
    <div data-testid='button'>
      {title}
    </div>
  )
}
const LearnApp = () => {
  return (
    <div>
      <header>
        <Button title="click me"></Button>
      </header>
    </div>
  );
}


export default LearnApp