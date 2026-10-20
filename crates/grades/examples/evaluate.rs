//! Native test harness for the JSON boundary. Not part of the web application.
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    println!("{}", grades::evaluate_json(&input));
}
