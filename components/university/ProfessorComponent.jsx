import {Text, View, StyleSheet} from "react-native"
import GroupComponet from "./GroupComponent";

const ProfessorComponent = ({name, title, universidade}) => {
    return(
        <View>
            <Text style = {styles.text}>Informações do Estudante</Text>
                <GroupComponet label="Name" content={name}/>
                <GroupComponet label="Title" content={title}/>
                <GroupComponet label="Universidade" content={universidade}/>
            </View>

    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"center"

  },
  text:{
    fontWeight:"bold",
    fontSize:20
  }

}
)


export default ProfessorComponent