import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandardCycle } from "@/pages/StandardCycle";
import { RefrigerantComparison } from "@/pages/RefrigerantComparison";
import { CascadeCycle } from "@/pages/CascadeCycle";
import NotFound from "@/pages/NotFound";

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-blue-900">Simulateon</h1>
          <p className="text-blue-600 mt-1">HVAC&R Engineering Simulation Tool</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white border border-blue-200">
            <TabsTrigger 
              value="standard" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Standard Cycle
            </TabsTrigger>
            <TabsTrigger 
              value="comparison" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Refrigerant Comparison
            </TabsTrigger>
            <TabsTrigger 
              value="cascade" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Cascade Cycle
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard" className="space-y-6">
            <StandardCycle />
          </TabsContent>
          
          <TabsContent value="comparison" className="space-y-6">
            <RefrigerantComparison />
          </TabsContent>
          
          <TabsContent value="cascade" className="space-y-6">
            <CascadeCycle />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
