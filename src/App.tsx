import { Navigate, Route, Routes } from 'react-router-dom';
import BillDetail from './screens/BillDetail';
import BillsList from './screens/BillsList';
import NewBill from './screens/NewBill';
import ReceiptScreen from './screens/ReceiptScreen';

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<BillsList />} />
        <Route path="/bills/new" element={<NewBill />} />
        <Route path="/bills/:id" element={<BillDetail />} />
        <Route path="/bills/:id/receipt" element={<ReceiptScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
