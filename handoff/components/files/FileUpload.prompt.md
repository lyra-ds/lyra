Dropzone multiupload com progresso por arquivo. O progresso é simulado (prototipagem) — conecte o upload real via `onFiles`.

```jsx
<FileUpload
  accept=".pdf,.png,.zip"
  maxSizeMB={25}
  onFiles={(files) => console.log(files)}
/>
```

Para mostrar um estado pronto em demos, use `defaultItems`:

```jsx
<FileUpload defaultItems={[
  { id: "1", name: "contrato.pdf", size: 482000, progress: 100, status: "done" },
  { id: "2", name: "fotos.zip", size: 8200000, progress: 64, status: "uploading" },
]} />
```
