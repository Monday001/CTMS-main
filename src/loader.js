export default function loader(source) {
  const modulePaths = {
    'canvas/build/Release/canvas.node': '/path/to/your/canvas.node',
    'canvas/lib/bindings.js': '/path/to/your/bindings.js',
    'canvas/index.js': '/path/to/your/canvas/index.js',
    'pdfjs-dist/build/pdf.js': '/path/to/your/pdf.js',
    'src/app/Student/page.tsx': '/path/to/your/page.tsx',
  };

  for (const modulePath in modulePaths) {
    const replacement = `require('${modulePaths[modulePath]}')`;
    source = source.replace(new RegExp(`require\\('${modulePath}'\\)`, 'g'), replacement);
  }

  return source;
}
