import {SafeAreaView, StatusBar, Text, StyleSheet} from "react-native"
import StudentComponent from "./university/StudentComponent"
const UniversityComponent = () =>{
    return (
        <SafeAreaView style={StyleSheet.container}>
            <StatusBar hidden={false}/>
            <Text style={StyleSheet.title}>Lista de Estudantes</Text>
            <StudentComponent
        name="Jeferson de Carvalho"
        course="Design Digital"
        ira={7.6}
        imagesrc="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlgSFO43HFOunQUSyPwAPFD9LDzS6dhmS1ieqUZiYzZA&s=10"


        />
        </SafeAreaView>
    
    
    )
}

export default UniversityComponent