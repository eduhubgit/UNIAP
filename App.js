import {Text, View, StyleSheet, ScrollView} from "react-native"
import StudentComponent from "./components/university/StudentComponent"
//import ProfessorComponent from "./components/university/ProfessorComponent"


const App = () => {
  return(
   <StudentComponent 
   name = "Jerferson de Carvalho"
   course = "Design DIgital"
   ira = {7.6}
   imagesrc = "https://m.media-amazon.com/images/M/MV5BOGQ5YWFjYjItODE5OC00ZDQxLTk5ZmYtNzY0YzM4NjIyMWFlXkEyXkFqcGc@._V1_.jpg"
   />
    
  );


};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"center"

  },
  text:{
    fontWeight:"bold",
    fontSize:60
  }

})

export default App