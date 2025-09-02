import UploadZone from "@/components/upload-zone";
import { Card, CardContent } from "@/components/ui/card";

export default function Upload() {
  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div>
          <h2 className="text-2xl font-semibold" data-testid="page-title">Upload Images</h2>
          <p className="text-muted-foreground">Compress your images with TinyPNG API</p>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <UploadZone />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
