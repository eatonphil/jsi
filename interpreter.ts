import * as ts from 'typescript';

const TS_COMPILER_OPTIONS = {
  allowNonTsExtensions: true,
};

function parse(fileName: string): ts.Program {
  return ts.createProgram([fileName], TS_COMPILER_OPTIONS);
}

function interpretCall(ce: ts.CallExpression) {
  const fn = interpretNode(ce.expression);
  const args = ce.arguments.map(interpretNode);
  return fn(...args);
}

function interpretBinaryExpression(be: ts.BinaryExpression) {
  const left = interpretNode(be.left);
  const right = interpretNode(be.right);
  switch (be.operatorToken.kind) {
    case ts.SyntaxKind.PlusToken:
      return left + right;
    default:
      throw new Error('Unsupported operator: ' + ts.SyntaxKind[be.operatorToken.kind]);
  }
}

function interpretNode(node: ts.Node) {
  switch (node.kind) {
    case ts.SyntaxKind.ExpressionStatement: {
      const es = node as ts.ExpressionStatement;
      return interpretNode(es.expression);
    }
    case ts.SyntaxKind.CallExpression: {
      const ce = node as ts.CallExpression;
      return interpretCall(ce);
    }
    case ts.SyntaxKind.BinaryExpression: {
      const be = node as ts.BinaryExpression;
      return interpretBinaryExpression(be);
    }
    case ts.SyntaxKind.Identifier: {
      const id = (node as ts.Identifier).escapedText as string;
      if (id === 'print') {
	return function (...args) { console.log(...args); };
      }

      throw new Error('Unsupported identifier: ' + id);
    }
    case ts.SyntaxKind.NumericLiteral: {
      const nl = node as ts.NumericLiteral;
      return Number(nl.text);
    }
    case ts.SyntaxKind.EndOfFileToken:
      break;
    default:
      throw new Error('Unsupported node type: ' + ts.SyntaxKind[node.kind]);
  }
}

function interpret(program: ts.Program) {
  return program.getSourceFiles().map((source) => {
    const { fileName } = source;
    if (fileName.endsWith('.d.ts')) {
      return;
    }

    const results = [];
    ts.forEachChild(source, (node) => {
      results.push(interpretNode(node));
    });
    return results;
  });
}

function main(entrypoint: string) {
  const program = parse(entrypoint);
  interpret(program);
}

main(process.argv[2]);
