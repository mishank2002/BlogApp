import './App.css';
import { Route,Routes } from 'react-router-dom';
import { UserContextProvider } from './UserContext';
import Layout from './Layout';
import {Login,IndexPage,Register,CreatePost,EditPost,PostPage} from './Pages';

function App() {
  return (
    <UserContextProvider>

    <Routes>
      <Route path='/' element={<Layout/>}>
        <Route index element={<IndexPage/>}/>
        <Route path='/login' element={<Login/>}/>        
        <Route path='/register' element={<Register/>}/>        
        <Route path='/create' element={<CreatePost/>}/>    
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/edit/:id" element={<EditPost />} />    
      </Route>
    </Routes>

    </UserContextProvider>
    
  );
}

export default App;
