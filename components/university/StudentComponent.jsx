import {Text, View, StyleSheet, Image} from "react-native"
//import GroupComponet from "./GroupComponent";

const StudentComponent = ({name, course, ira, imagesrc}) => {

    return(
        <View style={styles.card}>
          <Image source={{uri:imagesrc}} style={styles.image}/>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.course}>{course}</Text>
          </View>
          <View style={styles.iraBox}>
            <Text style={styles.label}>IRA</Text>
            <Text style={styles.ira}>{ira}</Text>
          </View>
      </View>

    )
}

const styles = StyleSheet.create(
  {

  card:{

    flexDirection:"row",
    alignItems: "center",
    justifyContent: "center",
    padding:16,
    backgroundColor: "#a4a3a3",
    borderRadius: 14,
    
    shadowColor: "#000", 
    shadowOffset: {width:0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,



  },

  image:{
    width: 80,
    height: 80,
    borderRadius:40,
    marginRight:16,
    backgroundColor: "blue"



  },
  info:{

  },
  
  name:{
    fontSize: 20,
    fontWeight: "bold",
    color:"#111213"

  },

  course:{
    color:"#111213",
    fontWeight: "bold",

  },

  label:{
    fontSize: 16,
    color:"#282828",
    marginRight: 6

  },

   iraBox:{
    flexDirection:"row"

  },

  ira:{
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF"

  },

 


  

}
)


export default StudentComponent