import React from "react";
import ReactDom from "react-dom";
import { Button } from "./LearnApp";
import { render } from "@testing-library/react";
import renderer from "react-test-renderer";

it('render withount crashing', () => {
  const div = document.createElement('div');
  ReactDom.render(<Button></Button>, div)
})

it('render button correctly', () => {
  const {getByTestId} = render(<Button title='click me'></Button>)
  expect(getByTestId('button')).toHaveTextContent('click me')
})

it('matches snapshot', () => {
  const tree = renderer.create(<Button title='click me'></Button>).toJSON()
  expect(tree).toMatchSnapshot()
})
